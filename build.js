// build skeleton
function build(){
  let config;
  console.log(
    '\x1b[92m[\x1b[94msicarii\x1b[92m:\x1b[94mbuild\x1b[92m] \x1b[96mStarting\x1b[0m'
  )
  try {
    config = require(process.cwd() + '/config/config');
    console.log(
      '\x1b[92m[\x1b[94msicarii\x1b[92m:\x1b[94mbuild\x1b[92m] \x1b[96mConfig file already found.\x1b[0m'
    )
    process.exit();
  } catch (err) {
    require('./lib/utils/init').config();
    require('./lib/utils/init').build();
    console.log(
      '\x1b[92m[\x1b[94msicarii\x1b[92m:\x1b[94mbuild\x1b[92m] \x1b[96mBuild complete.\x1b[0m'
    )
    process.exit();
  }
}

module.exports = { build }
