import wrapper from 'solc/wrapper'
// const wrapper = require('solc/wrapper')
const solc = wrapper((window as any).Module)
export { solc }
