import { Command, flags } from "@oclif/command";
import * as chalk from "chalk";
import { sync as commandExistsSync } from "command-exists";
import * as emoji from "node-emoji";
import * as opn from "open";
import * as path from "path";
import * as tempDirectory from "temp-dir";
import * as urlParse from "url-parse";
import * as util from "util";
import { v1 as uuid } from "uuid";

// tslint:disable-next-line: no-var-requires
const pjson = require("../package.json");
// tslint:disable-next-line: no-var-requires
const exec = util.promisify(require("child_process").exec);

class ReactInstant extends Command {
  public static description = "Launches preview of a remote React project.";

  public static flags = {
    branch: flags.string({ char: "b", description: "Specify git branch." }),
    buildScript: flags.string({ description: "Script name executed on build." }),
    envPath: flags.string({ description: "Path to .env file." }),
    excludeTest: flags.boolean({ description: "Skip the testing step.", default: false }),
    forceClean: flags.boolean({ description: "Forces clean-up at the very end." }),
    omitServe: flags.boolean({ description: "Omits the serving step.", default: false }),
    port: flags.integer({ char: "p", description: "Custom port." }),
    save: flags.string({ char: "s", description: "Provide an url to save the project permanenty." }),
    verbose: flags.boolean(),
    version: flags.version({ char: "v" }),
  };

  public static args = [{ name: "git_url" }];

  private verbose = false;
  private prefersYarn = false;
  private dir = "";
  private readonly platform = process.platform;

  /**
   * Prefered package manager. (yarn or npm)
   */
  private get getPM() {
    return this.prefersYarn ? "yarn" : "npm";
  }

  /**
   * Here it all begins...
   */
  public async run() {
    this.log(`react-instant v${pjson.version}\n`);
    const { args, flags: flgs } = this.parse(ReactInstant);

    this.verbose = flgs.verbose;

    this.dir = path.resolve(flgs.save || `${tempDirectory}/react-instant-${uuid()}`);
    this.verboseLog(`Path was set to ${this.dir}`);

    const gitUrl = this.parseUrl(args.git_url);

    // TODO: Refactor to own "showWarnings" function.
    // Warn about active --omitServe flag.
    !!flgs.omitServe && !flgs.save &&
      this.log(`${emoji.get("warning")} ${chalk.yellow("Running command with --omitServe flag. It has no effect unless you save the project by using --save flag.")}`);

    // Warn about active --excludeTest flag.
    !!flgs.excludeTest &&
      this.log(`${emoji.get("warning")} ${chalk.yellow('Running command with --excludeTest flag. Testing step will be skipped.')}`);

    this.log(`\n`); // Just a touch of elegancy. :D

    // Resolve the env path.
    flgs.envPath = flgs.envPath ? path.resolve(flgs.envPath || "") : undefined;

    process.on("SIGINT", async () => {
      if (flgs.forceClean) await this.cleanRepo();
      process.exit();
    });

    await this.checkDependencies();
    await this.cloneRepo(gitUrl, flgs.branch);
    await this.copyFiles(flgs.envPath);
    await this.installDeps();
    if (!flgs.excludeTest) await this.testRepo();
    await this.buildRepo(flgs.buildScript ?? "build");
    if (flgs.omitServe)
      this.exit(0);

    await this.serveRepo(flgs.port || 5000);
  }

  /**
   * Checks if required packages are installed.
   */
  private async checkDependencies() {
    // Check for yarn
    if (commandExistsSync("yarn")) {
      this.prefersYarn = true;
      this.verboseLog("Default package manager set to yarn.");
    }
    // Check for git
    if (!commandExistsSync("git")) {
      throw new Error("'git' is not installed.");
    }
    // Check for serve
    if (!commandExistsSync("serve")) {
      throw new Error("'serve' is not installed. Try npm install -g serve")
    }
  }

  /**
   * Clones git repository.
   * @param url URL to repository.
   */
  private async cloneRepo(url: string, branch?: string) {

    this.log(`${emoji.get('floppy_disk')} Cloning ${chalk.underline(url)}...`)
    this.verboseLog(`Cloning ${url} to ${this.dir}...`);

    this.verboseLog(await exec(`git clone ${url} ${this.dir}`));
    this.verboseLog(await exec(`cd ${this.dir} && git fetch`));

    if(branch) {
      this.log(`${emoji.get("twisted_rightwards_arrows")} Switching branch to ${chalk.underline(branch)}`)

      this.verboseLog(await exec(`cd ${this.dir} && git checkout ${branch}`));
    }
  }

  /**
   * Copies sideloaded files.
   * @param envPath Path to .env file.
   * TODO: Refactor.
   */
  private async copyFiles(envPath?: string) {
    if (envPath === undefined /*|| ...*/) {
      return;
    }
    this.log(`${emoji.get("clipboard")} Copying additional files...`);

    if (envPath) {
      this.verboseLog("envPath = " + envPath)

      if (this.platform === "win32") {
        const cmdExec = await exec(`xcopy "${envPath}" "${this.dir}" /h`)
        this.verboseLog(cmdExec);
        try {
          const cmdTestExec = await exec(`type "${path.resolve(this.dir + "\\.env")}"`)
          this.verboseLog(cmdTestExec);
        } catch (err) {
          this.verboseLog(err.message);
          throw new Error("There was an error while copying .env file.");
        }

        // Throw an error if no file is copied.
        if (cmdExec.stdout.includes("0 File(s) copied"))
          throw new Error("Unable to copy .env file. Please make sure the path is correct.");

      } else {
        const cmdExec = await exec(`cp "${envPath}" "${this.dir}/.env"`);
        this.verboseLog(cmdExec);
        try {
          const cmdTestExec = await exec(`test -f "${path.resolve(this.dir + "/.env")}" && echo "ok."`)
          this.verboseLog(cmdTestExec);
          if ((!cmdTestExec.stdout.includes("ok.")))
            throw new Error("Unable to copy .env file. Please make sure the path is correct.");
        } catch (err) {
          this.verboseLog(err.message);
          throw new Error("There was an error while copying .env file.");
        }
      }

      this.verboseLog(`Copied ${chalk.underline(".env")} file.`)
    }
  }

  /**
   * Installs project's dependencies.
   */
  private async installDeps() {
    this.log(`${emoji.get("package")} Installing dependencies...`);

    const waitTimeout = setTimeout(() => {
      this.log(emoji.get("construction") + " Still working... Please be patient.");
    }, 1000*60*60*2);

    this.verboseLog(
      await exec(
        `cd ${this.dir} && ${this.constructPMCommand({ npm: `install` })}`
      )
    );
    clearTimeout(waitTimeout);
  }

  /**
   * Builds project.
   * @param buildScript Script name for building project. (Defaults to "build")
   */
  private async buildRepo(buildScript: string) {
    this.log(`${emoji.get("building_construction")} Building project...`);

    this.verboseLog(
      await exec(`cd ${this.dir} && ${this.constructPMCommand({ yarn: buildScript, npm: `run-script ${buildScript}` })}`)
    );
  }

  /**
   * Tests project.
   */
  private async testRepo() {
    this.log(`${emoji.get("white_check_mark")} Testing project...`);

    try {
      this.verboseLog(
        await exec(`cd ${this.dir} && ${this.constructPMCommand({ yarn: "test --watchAll=false", npm: `run-script test --watchAll=false` })}`)
      );
    } catch (err) {
      this.verboseLog(err);
      this.log(`${emoji.get("boom")} A test failed. You can try running the command with a "--excludeTest" flag.`);
      throw new Error('A test failed. You can try running the command with a "--excludeTest" flag.');
    }
  }

  /**
   * Serves project.
   * @param port Served port.
   */
  private async serveRepo(port: number) {
    this.log(emoji.get("rocket") + " Serving project on port " + chalk.underline(port) + "...\n");
    this.log(`Now you can preview this project under ${chalk.underline(`http://localhost:${port}/`)}`);

    // tslint:disable-next-line: no-http-string
    await opn(`http://localhost:${port}/`, { url: true });

    this.verboseLog(await exec(`cd ${this.dir} && serve -s build -l ${port}`));
  }

  private async cleanRepo() {
    this.log(emoji.get("wastebasket") + " Cleaning up...");

    try {
      if (this.platform === "win32") {
        this.verboseLog(await exec(`rmdir "${this.dir}" /s /q`));
      } else {
        this.verboseLog(await exec(`rm -rf ${this.dir}`));
      }
    } catch (err) {
      this.verboseLog(err.message);
      this.log(`${emoji.get("boom")} ${chalk.red(`An error occurred while cleaning repo. Please try doing it manually by deleting the directory (${chalk.underline(this.dir)})`)}`);
    }
  }

  /**
   * Prints verbose log.
   * @param args Message.
   */
  private verboseLog(...args: any[]) {
    if (!this.verbose) {
      return;
    }

    this.log(`${emoji.get("point_right")} `, ...args);
  }

  /**
   * Parses git url.
   * @param url Url to repository. eg. https://github.com/user/repo.git or user/repo
   */
  private parseUrl(url: string) {
    if (!url) {
      throw new Error(emoji.get("no_entry") + " No git url provided");
    }
    this.verboseLog(url);
    // tslint:disable-next-line: strict-type-predicates triple-equals
    if(urlParse(url, true).origin != "null") {
      return url;
    }

    if(url.split("/").length === 2) {
      return `https://github.com/${url}`;
    }

    throw new Error(emoji.get("no_entry") + " Provided invalid git url.");
  }

  /**
   * Constructs an command for prefered package manager.
   * @param args String args for both yarn and npm or an object with separated args for each package manager.
   */
  private constructPMCommand(args: string | { yarn?: string, npm?: string }) {
    const pm = this.getPM;

    if (typeof args === "string")
      return `${pm} ${args}`;
    else
      if (pm === "yarn") {
        return `yarn ${args.yarn ?? ""}`
      } else {
        return `npm ${args.npm ?? ""}`;
      }
  }
}

export = ReactInstant;
