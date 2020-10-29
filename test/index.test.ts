// @ts-ignore
const { expect, test } = require('@oclif/test');

const cmd = require('../lib');

/** Coming soon */
describe('react-instant', () => {
  test
    .stdout()
    .do(async () => await cmd.run(['https://github.com/DRFR0ST/physiomedica-website.git', "--omitServe"]))
    .exit(0)
    .it('from git url test exits with success.')

  test
    .stdout()
    .do(async () => await cmd.run(['DRFR0ST/physiomedica-website', "--omitServe"]))
    .exit(0)
    .it('GitHub shorthand test exits with success.')

  test
    .stdout()
    .do(async () => await cmd.run(['DRFR0ST/marko-eling-portfolio', "--omitServe", "--buildScript", "compose"]))
    .exit(0)
    .it('buildScript flag test exits with success.')

  test
    .stdout()
    .do(async () => await cmd.run(['DRFR0ST/marko-eling-portfolio', "--omitServe"]))
    .catch(err => expect(err.message).to.include('Command "build" not found.'))
    .it('buildScript flag test exits with an error.')

  // test
  //   .stdout()
  //   .do(async () => await cmd.run(['DRFR0ST/circles-web', "--omitServe", "--envPath", "test/.env"]))
  //   .exit(0)
  //   .it('envPath flag test exits with success.')
})