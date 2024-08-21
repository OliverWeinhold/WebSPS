/**
 * WebSPS.js - A JavaScript-based implementation of a Programmable Logic Controller
 *
 * @author Oliver Weinhold
 * @copyright Copyright (c) 2024 Oliver Weinhold
 * @license GPLv3
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * For more information, please visit: https://github.com/OliverWeinhold/WebSPS
 */

// Only for development purposes 
// 
/** @DEBUG {DEBUG} Only for development purposes. Enables logging to console. Use "DEBUG && console.log()"*/
const DEBUG = false;

export class SPS {
  /** @SPSCode {string} Converted JS Code to be executed by the SPS */
  #SPSCode;

  /** @state {number} The current state of the SPS. 0 = Stopped, 1 = Running 2 = Paused */
  #state = 0;

  /** @dataReady {boolean} True if output registers were updated after input change */
  #dataReady = false;

  /** @runtimeTimer {timer} Stores Timeout Timer */
  #runtimeTimer;

  //Input, Flag and Output Registers
  /** @E {array} Internal input Registers */
  #E;
  /** @A {array} Internal output Registers */
  #A;
  /** @M {array} Internal flag Registers */
  #M;

  /** @RuntimeCounter {number} Counter for Runtime */
  #RuntimeCounter = 0;

  /** @SPSCycleTime {number} Wait time in ms between each SPS cycle */
  #SPSCycleTime = 10;

  /**
   * Constructs a new instance of the SPS class.
   *
   * @param {number} [Inputs=64] - The number of input registers. Defaults to 64.
   * @param {number} [Outputs=64] - The number of output registers. Defaults to 64.
   * @param {number} [Flags=64] - The number of flag registers. Defaults to 64.
   */
  constructor(Inputs = 64, Outputs = 64, Flags = 64) {
    if (Inputs > 256) this.#E = new Array(256).fill(0);
    else this.#E = new Array(Inputs).fill(0);
    if (Outputs > 256) this.#A = new Array(256).fill(0);
    else this.#A = new Array(Outputs).fill(0);
    if (Flags > 256) this.#M = new Array(256).fill(0);
    else this.#M = new Array(Flags).fill(0);
  }

  //Runtime is executed every SPSCycleTime ms
  #SPSRuntime = () => {
    this.#RuntimeCounter += 1;
    eval(this.#SPSCode);
    this.dataReady = true;
  };

  //Transition between States
  #changeSPSState(newState) {
    switch (newState) {
      case 0: {
        clearInterval(this.#runtimeTimer);
        this.#RuntimeCounter = 0;
        break;
      }
      case 1: {
        if(this.#runtimeTimer)
        this.#runtimeTimer = setInterval(this.#SPSRuntime, this.#SPSCycleTime);
        break;
      }
      case 2: {
        clearInterval(this.#runtimeTimer);
        break;
      }
    }
  }

  /**
   * Loads the IL code into the SPS and generates the corresponding JavaScript code.
   *
   * @param {string|string[]} ImputCode - The IL code to be loaded (Array for multiple networks).
   * @param {function} [errorCallback] - The error callback function. Does return an error message. If not provided, the default error callback logs the error to the console.
   * @return {number} - Returns 0 if the IL code is valid and the JavaScript code is generated successfully, -1 otherwise.
   */
  loadCode(ImputCode, errorCallback) {
    let invalidCommand = false;

    if (typeof errorCallback !== "function") {
      errorCallback = (message) => console.error(message);
    }
    this.codeInput = ImputCode;
    //Code with multiple networks
    let codeArray = Array.isArray(this.codeInput)
      ? this.codeInput.flatMap((element) => {
          const ret = generateCodeStructure(element, errorCallback);
          if (ret != null) return ret;
          else {
            invalidCommand = true;
            return [];
          }
        })
      : generateCodeStructure(this.codeInput, errorCallback);
    if (codeArray != null && codeArray.length > 0 && !invalidCommand) {
      this.#SPSCode = generateJSCode(codeArray, errorCallback);
      DEBUG && console.log("SPS:loadCode >> SPS Code: \n\n" + this.#SPSCode);
      return 0;
    } else {
      console.error("SPS:loadCode >> Invalid IL Code");
      this.#SPSCode = "";
      return -1;
    }
  }

  //Setter Methods
  /**
   * Sets the cycle time of the SPS.
   *
   * @param {number} delay - The cycle time in milliseconds.
   * @return {number} 0 if the cycle time is set successfully, -1 if the cycle time is out of range.
   */
  setCycleTime(delay) {
    if (delay > 10 || delay < 1000) {
      this.#SPSCycleTime = delay;
      return 0;
    } else {
      console.error(
        "SPS:setCycleTime >> Cycle Time must be between 10 and 1000ms"
      );
      return -1;
    }
  }

  /**
   * Sets the flags of the SPS.
   *
   * @param {array} flags - An array of flag values to be set.
   * @return {number} 0 if the flags are set successfully.
   */
  setFlags(flags) {
    dataReady = false;
    for (let i = 0; i < this.#M.length; i++) {
      this.#M[i] = flags[i];
    }
    DEBUG && console.log("SPS:setFlags >> Flags: " + this.#M);
    return 0;
  }

  /**
   * Sets the input values of the SPS.
   *
   * @param {array} inputs - An array of the inputs to be set.
   * @return {number} 0 if the input values are set successfully.
   */
  setInputs(inputs) {
    this.#dataReady = false;
    for (let i = 0; i < this.#E.length; i++) {
      this.#E[i] = inputs[i];
    }
    DEBUG && console.log("SPS:setInputs >> Input: " + this.#E);
    return 0;
  }

  //Getter Methods
  /**
   * Get the input states of the SPS.
   *
   * @return {array} An array of the input states.
   */
  getInputs() {
    const InputArray = [];
    for (let i = 0; i < 8; i++) {
      InputArray[i] = this.#E[i];
    }
    DEBUG && console.log("SPS:getInputs >> getInputs: " + this.#E);
    return InputArray;
  }

  /**
   * Get the current flag states of the SPS.
   *
   * @return {array} An array of the current flag states.
   */
  getFlags() {
    const FlagArray = [];
    for (let i = 0; i < this.#M.length; i++) {
      FlagArray[i] = this.#M[i];
    }
    DEBUG && console.log("SPS:getFlags >> Flags: " + this.#M);
    return FlagArray;
  }

  /**
   * Get the current output states of the SPS.
   *
   * @return {array} An array of the current output states.
   */
  getOutputs = () => {
    if (!this.#dataReady && this.#state == 1) {
      this.#SPSRuntime();
    }
    DEBUG && console.log("SPS:getOutputs >> Output: " + this.#A);
    return this.#A;
  };

  /**
   * Returns the current run-state of the SPS.
   *
   * @return {number} The current state of the SPS. 0 = Stopped, 1 = Running 2 = Paused
   */
  getState() {
    return this.#state;
  }

    /**
   * Returns the current runtime counter of the SPS (how often the Runtime has been called).
   *
   * @return {number} The current runtime counter of the SPS.
   */
  getRuntimeCounter() {
    return this.#RuntimeCounter;
  }

  //State Methods
  /**
   * Set the state to started. Starts or continues the SPS.
   *
   * @return {number} 0 if SPS is started, -1 if SPS is already started
   */
  start() {
    if (this.#state == 1) return -1; //SPS already started
    this.#state = 1;
    this.#changeSPSState(this.#state);
    DEBUG && console.log("SPS:Start >> State: " + this.#state);
    return 0;
  }

  /**
   * Set the state to stopped. Stops the SPS by resetting its state and clearing its input, output, and flag arrays.
   *
   * @return {number} 0 on successful stop
   */
  stop() {
    if (this.#state == 0) return -1; //SPS already stopped
    this.#state = 0;
    this.#E.fill(0);
    this.#A.fill(0);
    this.#M.fill(0);
    DEBUG && console.log(
        "SPS:Stop >> State: " +
          this.#state +
          " at counter: " +
          this.#RuntimeCounter
      );
    this.#changeSPSState(this.#state);
    return 0;
  }

  /**
   * Set the state to paused. In Paused state, the SPS will hold the current output and flag states
   *
   * @return {number} 0 on successful pause
   */
  pause() {
    if (this.#state == 2) return -1; //SPS already paused
    this.#state = 2;
    DEBUG && console.log(
      "SPS:Pause >> State: " +
        this.#state +
        " at counter: " +
        this.#RuntimeCounter
    );
    this.#changeSPSState(this.#state);
    return 0;
  }

  /**
   * Checks if data is updated.
   *
   * @return {boolean} True if output registers were updated after input change.
   */
  dataAvailable() {
    return this.#dataReady;
  }
}


// SPS Helper Functions

/**
 * Check if IL Code is valid and generates a Map that contains the Commands
 *
 * @param {String} CodeInput  - Code to be validated
 * @param {Function} errorCallback - Error callback
 * @return {Array} - Array of Commands {type: insType, instruction: instruction, blockNumber: Number of Instruction}
 */
function generateCodeStructure(CodeInput, errorCallback) {
  /* InsTypes:
   * 0 = Undefined
   * 1 = logical operation (U, O, X, NOT, UN, ON)
   * 2 = Instruction (S, R, =)
   * 3 = Operand (a, e, m)
   * 4 = Bracket ((, ))
   * 5 = comment (//)
   * 6 = End of Network (;)
   */

  const validlogicalOperations = ["U", "O", "X", "NOT", "UN", "ON"];
  const validInstructions = ["=", "S", "R"];
  const validOperands = ["A", "E", "M"];
  const validBrackets = ["(", ")"];

  //Generate RegEx to check for valid operands with only numbers following
  let validOperandsRegex = new RegExp(`^(${validOperands.join("|")})\\d+$`);

  var BracketCount = 0;

  var invalidCommand = false;

  /** commandArray: {type: insType, instruction: instruction, blockNumber: Number of Instruction} */
  var commandArray = [];

  //Convert Code to upper Case
  CodeInput = CodeInput.toUpperCase();

  //Remove comments
  CodeInput = CodeInput.replace(/\/\/.*$/gm, "");

  // Split the code input by line, brackets and spaces
  var codeParts = CodeInput.split(/([\s\t\n(){}\[\]])/);
  codeParts = codeParts.filter(
    (part) => part.trim().length > 0 || /[(){}\[\]]/.test(part)
  );

  //TODO: Check for commands in right order (first Ops or Inst, then operands)
  codeParts.forEach((codePart) => {
    //check for Type
    if (validlogicalOperations.includes(codePart)) {
      commandArray.push({
        type: 1,
        instruction: codePart,
        blockNumber: commandArray.length,
      });
    } else if (validInstructions.includes(codePart)) {
      commandArray.push({
        type: 2,
        instruction: codePart,
        blockNumber: commandArray.length,
      });
    } else if (validOperandsRegex.test(codePart)) {
      commandArray.push({
        type: 3,
        instruction: codePart,
        blockNumber: commandArray.length,
      });
    } else if (validBrackets.includes(codePart)) {
      if (codePart == "(") BracketCount++;
      else BracketCount--;
      commandArray.push({
        type: 4,
        instruction: codePart,
        blockNumber: commandArray.length,
      });
    } else {
      errorCallback(
        "generateCodeStructure >> Unknown command or operand found: " + codePart
      );
      invalidCommand = true;
      return null; // Invalid command or operand found
    }
  });
  //Check if brackets are balanced
  if (BracketCount != 0) {
    errorCallback("generateCodeStructure >> Invalid bracket number");
    invalidCommand = true;
  }
  //check if invalid command is found
  if (invalidCommand) return null;

  //Add End of Network to fill empty if bodies
  commandArray.push({
    type: 6,
    instruction: ";",
    blockNumber: commandArray.length,
  });
  return commandArray;
}

/**
 * Generates JavaScript code from a given command array.
 *
 * @param {Array} commandArray - An array of SPS commands to generate JavaScript code from.
 * @param {Function} errorCallback - A callback function to handle errors during code generation.
 * @return {String} The generated JavaScript code.
 */
function generateJSCode(commandArray, errorCallback) {
  var JSCode = "";
  var lastInstruction = "";
  var isNewBlock = true;
  var openIfBlock = false;
  var NOT = false;

  commandArray.forEach((command) => {
    if (command.type == 6) {
      JSCode += "; // End of Network\n";
      return null;
    }
    if (isNewBlock) {
      switch (command.type) {
        case 1: {
          openIfBlock = true;
          isNewBlock = false;
          if(command.instruction == "NOT")  JSCode += "if( !";
          else JSCode += "if( ";
          break;
        }
        case 2: {
          if (command.instruction == "S") {
            lastInstruction = "S";
            isNewBlock = false;
            break;
          } else if (command.instruction == "R") {
            lastInstruction = "R";
            isNewBlock = false;
            break;
          } else {
            errorCallback(
              "generateJSCode >> Missing logical Operand before =: " +
                command.instruction
            );
            return null;
          }
        }
        case 4: {
          errorCallback(
            "generateJSCode >> Bracket without logical Operand: " +
              command.instruction
          );
          return null;
        }
        default: {
          errorCallback(
            "generateJSCode >> Not valid as first command: " +
              command.instruction
          );
          return null;
        }
      }
    } else
      switch (command.type) {
        case 1: {
          if (command.instruction == "U") JSCode += " && ";
          else if (command.instruction == "O") JSCode += " || ";
          else if (command.instruction == "X") JSCode += " !==";
          else if (command.instruction == "NOT") JSCode += " !";
          else if (command.instruction == "UN") JSCode += " && !";
          else if (command.instruction == "ON") JSCode += " || !";
          else {
            errorCallback(
              "generateJSCode >> Unknown logical Operant: " +
                command.instruction
            );
            return null;
          }
          break;
        }
        case 2: {
          if (command.instruction == "S") {
            lastInstruction = "S";
          } else if (command.instruction == "R") {
            lastInstruction = "R";
          } else {
            lastInstruction = "=";
          }
          break;
        }
        case 3: {
          var slicedCommand = [command.instruction[0]];
          slicedCommand.push(parseInt(command.instruction.slice(1)) - 1);
          if (openIfBlock) {
            if (lastInstruction == "S") {
              lastInstruction = "";
              openIfBlock = false;
              isNewBlock = true;
              JSCode +=
                ") { " +
                "this.#" +
                slicedCommand[0] +
                "[" +
                slicedCommand[1] +
                "]" +
                " = true; } \n";
            } else if (lastInstruction == "R") {
              lastInstruction = "";
              openIfBlock = false;
              isNewBlock = true;
              JSCode +=
                ") { " +
                "this.#" +
                slicedCommand[0] +
                "[" +
                slicedCommand[1] +
                "]" +
                " = false; }\n";
            } else if (lastInstruction == "=") {
              lastInstruction = "";
              openIfBlock = false;
              isNewBlock = true;
              JSCode +=
                ") { " +
                "this.#" +
                slicedCommand[0] +
                "[" +
                slicedCommand[1] +
                "]" +
                " = true; } else { " +
                "this.#" +
                slicedCommand[0] +
                "[" +
                slicedCommand[1] +
                "]" +
                " = false; }\n";
            } else
              JSCode +=
                "this.#" + slicedCommand[0] + "[" + slicedCommand[1] + "]";
            break;
          } else {
            if (lastInstruction == "S") {
              lastInstruction = "";
              JSCode +=
                "this.#" +
                slicedCommand[0] +
                "[" +
                slicedCommand[1] +
                "]" +
                " = true; ";
              isNewBlock = true;
            } else if (lastInstruction == "R") {
              lastInstruction = "";
              JSCode +=
                "this.#" +
                slicedCommand[0] +
                "[" +
                slicedCommand[1] +
                "]" +
                " = false; ";
              isNewBlock = true;
            } else {
              errorCallback(
                "generateJSCode >> Missing logical Operant before =: " +
                  command.instruction
              );
              return null;
            }
          }
          break;
        }
        case 4: {
          if (openIfBlock) {
            if (command.instruction == "(") JSCode += " ( ";
            else JSCode += " ) ";
          }
        }
      }
  });
  return JSCode;
}