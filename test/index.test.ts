// @ts-ignore
const { expect, test } = require('@oclif/test');

const cmd = require('../lib');

/** Coming soon */
describe('react-instant', () => {
  test
    .stdout()
    .do(async () => await cmd.run(['https://github.com/DRFR0ST/physiomedica-website.git']))
    .it('with gir url.', ctx => {
      expect(ctx.stdout).to.not.be.empty;
      expect(ctx.stderr).to.be.empty;
    })

  test
    .stdout()
    .do(async () => await cmd.run(['DRFR0ST/physiomedica-website']))
    .it('with GitHub shorthand.', ctx => {
      expect(ctx.stdout).to.not.be.empty;
      expect(ctx.stderr).to.be.empty;
    })

  test
    .stdout()
    .do(async () => await cmd.run(['DRFR0ST/marko-eling-portfolio --buildScript compose']))
    .it('with buildScript flag.', ctx => {
      expect(ctx.stdout).to.not.be.empty;
      expect(ctx.stderr).to.be.empty;
    })
})