/* @flow */

import { createCompiler } from './create-compiler'
// import { createCompiler } from 'compiler/index'
const { compile } = createCompiler({})

import { compileToWxml } from './codegen/index'

export { compile, compileToWxml }
