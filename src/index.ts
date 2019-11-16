import { Command, flags } from "@oclif/command";
import { sync as commandExistsSync } from "command-exists";
import * as opn from "open";
import * as tempDirectory from "temp-dir";
import * as util from "util";
import { v1 as uuid } from "uuid";

// tslint:disable-next-line: no-var-requires
const pjson = require("../package.json");
// tslint:disable-next-line: no-var-requires
const exec = util.promisify(require("child_process").exec);

class ReactInstant extends Command {
  public static description = "Launches preview of a remote React project.";

  public static flags = {
    port: flags.integer({ char: "p", description: "Custom port." }),
    save: flags.string({
      char: "s",
      description: "Provide a url to save the project permanenty."
    }),
    verbose: flags.boolean(),
    version: flags.version({ char: "v" })
  };

  public static args = [{ name: "git_url" }];

  private verbose = false;
  private prefersYarn = false;
  private dir = "";

  /**
   * Here it all begins...
   */
  public async run() {
    this.log(`react-instant v${pjson.version}\n`);
    const { args, flags: flgs } = this.parse(ReactInstant);

    this.verbose = flgs.verbose;

    this.dir = flgs.save || `${tempDirectory}/react-instant-${uuid()}`;
    this.verboseLog(`Path was set to ${this.dir}`);

    if (!args.git_url) {
      throw new Error("No git url provided");
    }

    await this.checkDependencies();
    await this.cloneRepo(args.git_url);
    await this.installDeps();
    await this.buildRepo();
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
      this.warn("serve not found, installing...");
      await exec(
        this.prefersYarn ? "yarn global add serve" : "npm install -g serve"
      );
    }
  }

  /**
   * Clones git repository.
   * @param url URL to repository.
   */
  private async cloneRepo(url: string) {
    !this.verbose
      ? this.log(`Cloning ${url}...`)
      : this.verboseLog(`Cloning ${url} to ${this.dir}...`);

    this.verboseLog(await exec(`git clone ${url} ${this.dir}`));
  }

  /**
   * Installs project's dependencies.
   */
  private async installDeps() {
    this.log("Installing dependencies...");

    this.verboseLog(
      await exec(
        `cd ${this.dir} && ${this.prefersYarn ? "yarn" : "npm install"}`
      )
    );
  }

  /**
   * Builds project.
   */
  private async buildRepo() {
    this.log("Building project...");

    this.verboseLog(
      await exec(`cd ${this.dir} && ${this.prefersYarn ? "yarn" : "npm"} build`)
    );
  }

  /**
   * Serves project.
   * @param port Served port.
   */
  private async serveRepo(port: number) {
    this.log("Serving project on port " + port + "...\n");
    this.log(`Now you can preview the project under http://localhost:${port}/`);

    // tslint:disable-next-line: no-http-string
    await opn(`http://localhost:${port}/`, { url: true });

    this.verboseLog(await exec(`cd ${this.dir} && serve -s build -l ${port}`));
  }

  /**
   * Prints verbose log.
   * @param args Output texts.
   */
  private verboseLog(...args: any[]) {
    if (!this.verbose) {
      return;
    }

    this.log("-> ", ...args);
  }
}

export = ReactInstant;
