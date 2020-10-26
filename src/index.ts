import { Command, flags } from "@oclif/command";
import { sync as commandExistsSync } from "command-exists";
import * as opn from "open";
import * as tempDirectory from "temp-dir";
import * as urlParse from "url-parse";
import * as util from "util";
import * as path from "path";
import { v1 as uuid } from "uuid";
import * as chalk from "chalk";
import * as emoji from "node-emoji";

// tslint:disable-next-line: no-var-requires
const pjson = require("../package.json");
// tslint:disable-next-line: no-var-requires
const exec = util.promisify(require("child_process").exec);

class ReactInstant extends Command {
  public static description = "Launches preview of a remote React project.";

  public static flags = {
    port: flags.integer({ char: "p", description: "Custom port." }),
    save: flags.string({ char: "s", description: "Provide an url to save the project permanenty." }),
    verbose: flags.boolean(),
    version: flags.version({ char: "v" }),
    branch: flags.string({ char: "b", description: "Specify git branch." }),
    buildScript: flags.string({ description: "Script name executed on build." }),
    envPath: flags.string({ description: "Path to .env file." })
  };

  public static args = [{ name: "git_url" }];

  private verbose = false;
  private prefersYarn = false;
  private dir = "";
  private platform = process.platform;

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

    this.dir = flgs.save || `${tempDirectory}/react-instant-${uuid()}`;
    this.verboseLog(`Path was set to ${this.dir}`);

    const gitUrl = this.parseUrl(args.git_url);

    await this.checkDependencies();
    await this.cloneRepo(gitUrl, flgs.branch);
    await this.copyFiles(path.resolve(flgs.envPath || ""));
    await this.installDeps();
    await this.buildRepo(flgs.buildScript ?? "build");
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
    !this.verbose
      ? this.log(`${emoji.get('floppy_disk')} Cloning ${chalk.underline(url)}...`)
      : this.verboseLog(`Cloning ${url} to ${this.dir}...`);

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

        // Throw an error if no file is copied.
        if (cmdExec.stdout.includes("0 File(s) copied"))
          throw new Error("Unable to copy .env file. Please make sure the path is correct.");

      } else {
        this.verboseLog(await exec(`cp "${envPath}" "${this.dir}"`));
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
   */
  private async buildRepo(buildScript: string) {
    this.log(`${emoji.get("building_construction")} Building project...`);

    this.verboseLog(
      await exec(`cd ${this.dir} && ${this.constructPMCommand({ yarn: buildScript, npm: `run-script ${buildScript}` })}`)
    );
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
    // tslint:disable-next-line: strict-type-predicates
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
