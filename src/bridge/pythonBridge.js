import fs from 'fs';
import path from 'path';


export class PythonBridge{
  constructor(sendToBrowser){
    this._sendToBrowser = sendToBrowser;
    this._shell = null;
    this._python = '';
    this._messageId = 0;
    this._promises = {};
    this._pathToPython;


    const usePyinstaller = process.argv.includes('pyinstaller') || fs.existsSync(path.join(process.resourcesPath, 'engine', 'engine'));

    let engine = null;
    if (process.platform === 'win32'){
      this._log('Windows detected');
      engine = 'engine.exe';
    } else {
      engine = 'engine.app'
    }

    if(!usePyinstaller && process.env.NODE_ENV === 'development'){
      this._status = 'Bridge: running locally';
      this._python = './src/python/engine.py';
    } else if (fs.existsSync(path.join(__dirname, '..', '..', 'dist', 'engine', engine))){
      this._status = 'Bridge: running pyinstaller version locally';
      this._pathToPython = path.join(__dirname, '..', '..', 'dist', 'engine', engine);
    } else if (fs.existsSync(path.join(process.resourcesPath, 'engine', engine))){
      this._status = 'Bridge: running pyinstaller version from resourcesPath';
      this._pathToPython = path.join(process.resourcesPath, 'engine', engine);
    } else if (fs.existsSync(path.join(process.resourcesPath, engine, 'engine'))){
      this._status = 'Bridge: running executable from resourcesPath';
      this._pathToPython = path.join(process.resourcesPath, engine, 'engine');
    }
    else {
      this._status = 'Bridge: No path to python detected, not running';
    }
    this._log(this._status);

    this.printStatus = (verbose) => {
      this._log('PythonBridge status:')
      this._log(this._status);
      if(verbose){
        this._log('usePyinstaller?');
        this._log(!!usePyinstaller)
        this._log('resource engine exists?')
        this._log(fs.existsSync(path.join(process.resourcesPath, 'engine', 'engine')))
      }
    }

    try{
      if(this._python || this._pathToPython){

        const options = {
          mode: 'json',
          stdio: ['pipe', 'pipe', 'pipe', 'pipe'], // stdin, stdout, stderr, custom
          pythonPath: this._pathToPython
        }

        this._log('Trying to launch shell: ', this._python);
        this._shell = new PythonShell(this._python, options);
        this._shell.on('message',msg=>{

          switch(msg.type){
            case 'debug': {
              this._log(msg.data);
              break;
            }
            case 'success':{
              const promise = this._promises[msg._id];
              if(promise){
                promise.resolve(msg.data);
                delete this._promises[msg._id];
              } else {
                console.error(`Bad message from python: _id=${msg._id} failed to find promise`);
              }
              break;
            }
            case 'error':{
              const promise = this._promises[msg._id];
              if(promise){
                promise.reject(msg.data);
                delete this._promises[msg._id];
              } else {
                console.error(`Bad message from python: _id=${msg._id} failed to find promise`);
              }
              break;
            }
            default: {
              console.warn('Unknown message type received from python:', msg);
            }
          }

        });
        this._shell.on('stderr', err=>{
          this._log('Python Error:', err);
        });

        // grab reference to original shell.send method and then overwrite with a function
        // that creates and registers a promise to be resolved by a response from python

        const shellSend = this._shell.send;
        this._shell.send = (data)=>{
          let message = {
            _id: this._messageId,
            data: data
          }
          this._promises[message._id] = {}
          const promise = new Promise((resolve, reject)=>{
            this._promises[message._id].resolve = resolve;
            this._promises[message._id].reject = reject;
          });
          this._messageId += 1;
          shellSend.call(this._shell, message);
          return promise;
        }




      } else {
        this._log('Error: Could not find python script')
      }
    } catch(e){
      this._log('PythonBridge exception: ' + e);
    }
  }
  async invoke(func, data, log){
    if(log){
      this._log(`Invoking ${func} on shell:`, data);
    }
    return this._shell ? this._shell.send({function: func, data: data}) : Promise.reject('Python shell does not exist');
  }
  // async file(f){
  //     this._log('Sending file to shell:', f);
  //     return this._shell && this._shell.send({type:'file', 'file': f});
  // }

  logPythonPath(){
    this._log(this._python);
  }
  _log(){
    console.log('_log:',...arguments);
    if(this._sendToBrowser){
      this._sendToBrowser(Array.from(arguments).map(JSON.stringify).join(' | '));
    }
  }
}


// Code below is adapted from python-shell package https://github.com/extrabacon/python-shell

// The MIT License (MIT)
// Copyright (c) 2014 Nicolas Mercier
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
//  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
// OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { EventEmitter } from 'events';
import { spawn, exec, execSync } from 'child_process';
import { EOL as newline, tmpdir } from 'os';
import { join, sep } from 'path'
import { Transform } from 'stream'
import { writeFile } from 'fs';
import { promisify } from 'util';

function toArray(source){
  if (typeof source === 'undefined' || source === null) {
    return [];
  } else if (!Array.isArray(source)) {
    return [source];
  }
  return source;
}

/**
 * adds arguments as properties to obj
 */
function extend(obj, ...args) {
  Array.prototype.slice.call(arguments, 1).forEach(function (source) {
    if (source) {
      for (let key in source) {
        obj[key] = source[key];
      }
    }
  });
  return obj;
}

/**
 * gets a random int from 0-10000000000
 */
function getRandomInt() {
  return Math.floor(Math.random() * 10000000000);
}

const execPromise = promisify(exec)

class PythonShellError extends Error {
  traceback;
  exitCode;
}


/**
 * Takes in a string stream and emits batches seperated by newlines
 */
export class NewlineTransformer extends Transform {
  // NewlineTransformer: Megatron's little known once-removed cousin
  // private _lastLineData: string;
  _transform(chunk, encoding, callback){
    let data = chunk.toString()
    if (this._lastLineData) data = this._lastLineData + data
    const lines = data.split(newline)
    this._lastLineData = lines.pop()
    //@ts-ignore this works, node ignores the encoding if it's a number
    lines.forEach(this.push.bind(this))
    callback()
  }
  _flush(done){
    if (this._lastLineData) this.push(this._lastLineData)
    this._lastLineData = null;
    done()
  }
}

/**
 * An interactive Python shell exchanging data through stdio
 * @param {string} script    The python script to execute
 * @param {object} [options] The launch options (also passed to child_process.spawn)
 * @param [stdoutSplitter] Optional. Splits stdout into chunks, defaulting to splitting into newline-seperated lines
 * @param [stderrSplitter] Optional. splits stderr into chunks, defaulting to splitting into newline-seperated lines
 * @constructor
 */
export class PythonShell extends EventEmitter {
  // scriptPath: string
  // command: string[]
  // mode: string
  // formatter: (param: string | Object) => any
  // parser: (param: string) => any
  // stderrParser: (param: string) => any
  // terminated: boolean
  // childProcess: ChildProcess
  // stdin: Writable;
  // stdout: Readable;
  // stderr: Readable;
  // exitSignal: string;
  // exitCode: number;
  // private stderrHasEnded: boolean;
  // private stdoutHasEnded: boolean;
  // private _remaining: string
  // private _endCallback: (err: PythonShellError, exitCode: number, exitSignal: string) => any

  // starting 2020 python2 is deprecated so we choose 3 as default
  static defaultPythonPath = process.platform != "win32" ? "python3" : "python";

  static defaultOptions = {}; //allow global overrides for options

  /**
   * spawns a python process
   * @param scriptPath path to script. Relative to current directory or options.scriptFolder if specified
   * @param options
   * @param stdoutSplitter Optional. Splits stdout into chunks, defaulting to splitting into newline-seperated lines
   * @param stderrSplitter Optional. splits stderr into chunks, defaulting to splitting into newline-seperated lines
   */
  constructor(scriptPath, options, stdoutSplitter = null, stderrSplitter = null) {
    super();

    /**
     * returns either pythonshell func (if val string) or custom func (if val Function)
     */
    function resolve(type, val) {
      if (typeof val === 'string') {
        // use a built-in function using its name
        return PythonShell[type][val];
      } else if (typeof val === 'function') {
        // use a custom function
        return val;
      }
    }

    let self = this;
    let errorData = '';
    EventEmitter.call(this);

    options = extend({}, PythonShell.defaultOptions, options);
    let pythonPath;
    if (!options.pythonPath) {
      pythonPath = PythonShell.defaultPythonPath;
    } else pythonPath = options.pythonPath;
    let pythonOptions = toArray(options.pythonOptions);
    let scriptArgs = toArray(options.args);

    this.scriptPath = join(options.scriptPath || '', scriptPath);
    this.command = pythonOptions.concat(this.scriptPath, scriptArgs);
    this.mode = options.mode || 'text';
    this.formatter = resolve('format', options.formatter || this.mode);
    this.parser = resolve('parse', options.parser || this.mode);
    // We don't expect users to ever format stderr as JSON so we default to text mode
    this.stderrParser = resolve('parse', options.stderrParser || 'text');
    this.terminated = false;
    this.childProcess = spawn(pythonPath, this.command, options);

    ['stdout', 'stdin', 'stderr'].forEach(function (name) {
      self[name] = self.childProcess[name];
      self.parser && self[name] && self[name].setEncoding(options.encoding || 'utf8');
    });

    // Node buffers stdout&stderr in batches regardless of newline placement
    // This is troublesome if you want to recieve distinct individual messages
    // for example JSON parsing breaks if it recieves partial JSON
    // so we use newlineTransformer to emit each batch seperated by newline
    if (this.parser && this.stdout) {
      if(!stdoutSplitter) stdoutSplitter = new NewlineTransformer()
      // note that setting the encoding turns the chunk into a string
      stdoutSplitter.setEncoding(options.encoding || 'utf8')
      this.stdout.pipe(stdoutSplitter).on('data', (chunk) => {
        this.emit('message', self.parser(chunk));
      });
    }

    // listen to stderr and emit errors for incoming data
    if (this.stderrParser && this.stderr) {
      if(!stderrSplitter) stderrSplitter = new NewlineTransformer()
      // note that setting the encoding turns the chunk into a string
      stderrSplitter.setEncoding(options.encoding || 'utf8')
      this.stderr.pipe(stderrSplitter).on('data', (chunk) => {
        this.emit('stderr', self.stderrParser(chunk));
      });
    }

    if (this.stderr) {
      this.stderr.on('data', function (data) {
        errorData += '' + data;
      });
      this.stderr.on('end', function () {
        self.stderrHasEnded = true;
        terminateIfNeeded();
      });
    } else {
      self.stderrHasEnded = true;
    }

    if (this.stdout) {
      this.stdout.on('end', function () {
        self.stdoutHasEnded = true;
        terminateIfNeeded();
      });
    } else {
      self.stdoutHasEnded = true;
    }

    this.childProcess.on('error', function (err) {
      self.emit('error', err);
    })
    this.childProcess.on('exit', function (code, signal) {
      self.exitCode = code;
      self.exitSignal = signal;
      terminateIfNeeded();
    });

    function terminateIfNeeded() {
      if (!self.stderrHasEnded || !self.stdoutHasEnded || (self.exitCode == null && self.exitSignal == null)) return;

      let err;
      if (self.exitCode && self.exitCode !== 0) {
        if (errorData) {
          err = self.parseError(errorData);
        } else {
          err = new PythonShellError('process exited with code ' + self.exitCode);
        }
        err = extend(err, {
          executable: pythonPath,
          options: pythonOptions.length ? pythonOptions : null,
          script: self.scriptPath,
          args: scriptArgs.length ? scriptArgs : null,
          exitCode: self.exitCode
        });
        // do not emit error if only a callback is used
        if (self.listeners('pythonError').length || !self._endCallback) {
          self.emit('pythonError', err);
        }
      }

      self.terminated = true;
      self.emit('close');
      self._endCallback && self._endCallback(err, self.exitCode, self.exitSignal);
    };
  }

  // built-in formatters
  static format = {
    text: function toText(data) {
      if (!data) return '';
      else if (typeof data !== 'string') return data.toString();
      return data;
    },
    json: function toJson(data) {
      return JSON.stringify(data);
    }
  };

  //built-in parsers
  static parse = {
    text: function asText(data) {
      return data;
    },
    json: function asJson(data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.log("Error parsing JSON", e);
        console.log("Data received:", data);
        return null;
      }
    }
  };

  /**
   * checks syntax without executing code
   * @returns rejects promise w/ string error output if syntax failure
   */
  static async checkSyntax(code) {
    const randomInt = getRandomInt();
    const filePath = tmpdir() + sep + `pythonShellSyntaxCheck${randomInt}.py`

    const writeFilePromise = promisify(writeFile)
    return writeFilePromise(filePath, code).then(() => {
      return this.checkSyntaxFile(filePath)
    })
  }

  static getPythonPath() {
    return this.defaultOptions.pythonPath ? this.defaultOptions.pythonPath : this.defaultPythonPath;
  }

  /**
   * checks syntax without executing code
   * @returns {Promise} rejects w/ stderr if syntax failure
   */
  static async checkSyntaxFile(filePath) {
    const pythonPath = this.getPythonPath()
    let compileCommand = `${pythonPath} -m py_compile ${filePath}`
    return execPromise(compileCommand)
  }


  static getVersion(pythonPath) {
    if (!pythonPath) pythonPath = this.getPythonPath()
    return execPromise(pythonPath + " --version");
  }

  static getVersionSync(pythonPath) {
    if (!pythonPath) pythonPath = this.getPythonPath()
    return execSync(pythonPath + " --version").toString()
  }

  /**
   * Parses an error thrown from the Python process through stderr
   * @param  {string|Buffer} data The stderr contents to parse
   * @return {Error} The parsed error with extended stack trace when traceback is available
   */
  parseError(data) {
    let text = '' + data;
    let error;

    if (/^Traceback/.test(text)) {
      // traceback data is available
      let lines = text.trim().split(newline);
      let exception = lines.pop();
      error = new PythonShellError(exception);
      error.traceback = data;
      // extend stack trace
      error.stack += newline + '    ----- Python Traceback -----' + newline + '  ';
      error.stack += lines.slice(1).join(newline + '  ');
    } else {
      // otherwise, create a simpler error with stderr contents
      error = new PythonShellError(text);
    }

    return error;
  };

  /**
   * Sends a message to the Python shell through stdin
   * Override this method to format data to be sent to the Python process
   * @returns {PythonShell} The same instance for chaining calls
   */
  send(message) {
    if (!this.stdin) throw new Error("stdin not open for writing");
    let data = this.formatter ? this.formatter(message) : message;
    if (this.mode !== 'binary') data += newline;
    this.stdin.write(data);
    return this;
  };

  /**
   * Closes the stdin stream. Unless python is listening for stdin in a loop
   * this should cause the process to finish its work and close.
   * @returns {PythonShell} The same instance for chaining calls
   */
  end(callback) {
    if (this.childProcess.stdin) {
      this.childProcess.stdin.end();
    }
    this._endCallback = callback;
    return this;
  };

  /**
   * Sends a kill signal to the process
   * @returns {PythonShell} The same instance for chaining calls
   */
  kill(signal) {
    this.terminated = this.childProcess.kill(signal);
    return this;
  };

  /**
   * Alias for kill.
   * @deprecated
   */
  terminate(signal) {
    // todo: remove this next breaking release
    return this.kill(signal)
  }
};

// ////

// /*** Exports *****/
// const bridge = new PythonBridge();

// export {
//   bridge as PythonBridge,
// };
