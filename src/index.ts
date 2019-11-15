import { Command, flags } from "@oclif/command";
import { sync as commandExistsSync } from "command-exists";
import * as opn from "open";
import * as tempDirectory from "temp-dir";
import * as util from "util";
import { v1 as uuid } from "uuid";

const pjson = require("../package.json");
const exec = util.promisify(require("child_process").exec);

class ReactInstant extends Command {
  public static description = "describe the command here";

  public static flags = {
    port: flags.integer({ char: "p", description: "Custom port." }),
    save: flags.string({ char: "s", description: "Provide a url to save the project permanenty." }),
    verbose: flags.boolean(),
    version: flags.version({ char: "v" })
  };

  public static args = [{ name: "git_url" }];

  public verbose = false;
  public prefersYarn = false;
  public saveProjectPath: string | undefined = undefined;

  public async checkDependencies() {
    if (commandExistsSync("yarn")) {
      this.prefersYarn = true;
      this.verboseLog("Default package manager set to yarn.");
    }
    if (!commandExistsSync("git")) {
      throw new Error("'git' is not installed.");
    }
    if (!commandExistsSync("serve")) {
      this.log("serve not found, installing...");
      await exec(
        this.prefersYarn ? "yarn global add serve" : "npm install -g serve"
      );
    }
  }

  public async cloneRepo(url: string) {
    const tmpDir =
      this.saveProjectPath || `${tempDirectory}/react-instant-${uuid()}`;

    !this.verbose
      ? this.log(`Cloning ${url}...`)
      : this.verboseLog(`Cloning ${url} to ${tmpDir}...`);
    this.verboseLog(await exec(`git clone ${url} ${tmpDir}`));
    return tmpDir;
  }

  public async installDeps(tmpDir: string) {
    this.log("Installing dependencies...");
    this.verboseLog(
      await exec(`cd ${tmpDir} && ${this.prefersYarn ? "yarn" : "npm install"}`)
    );
  }

  public async buildRepo(tmpDir: string) {
    this.log("Building project...");
    this.verboseLog(
      await exec(`cd ${tmpDir} && ${this.prefersYarn ? "yarn" : "npm"} build`)
    );
  }

  public async serveRepo(tmpDir: string, port: number) {
    this.log("Serving project on port " + port + "...\n");
    this.log(`Now you can preview the project under http://localhost:${port}/`);
    await opn(`http://localhost:${port}/`, { url: true });
    this.verboseLog(await exec(`cd ${tmpDir} && serve -s build -l ${port}`));
  }

  public async run() {
    const { args, flags } = this.parse(ReactInstant);

    this.verbose = flags.verbose;
    this.saveProjectPath = flags.save;

    if (!args.gir_url) {
      throw new Error("No git url provided");
    }
    this.log(`react-instant v${pjson.version}\n`);
    this.verboseLog("Running in verbose mode\n");

    await this.checkDependencies();
    const tmpDir = await this.cloneRepo(args.gir_url);
    await this.installDeps(tmpDir);
    await this.buildRepo(tmpDir);
    await this.serveRepo(tmpDir, flags.port || 5000);
  }

  private verboseLog(...args: any[]) {
    if (!this.verbose) {
      return;
    }

    this.log("-> ", ...args);
  }
}

export = ReactInstant;
