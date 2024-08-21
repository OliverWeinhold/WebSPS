# WebSPS - Library for simple SPS (PLC) simulation

WebSPS is a JavaScript-based implementation of a SPS (Programmable Logic Controller), providing a flexible and extensible platform for executing industrial automation scripts directly in the browser. This library allows you to load and execute instruction list (IL) code (AWL in german), manage input/output registers, and simulate PLC operations with JavaScript.

> [!TIP]
> Example page for WebSPS.js is available at: [oliverweinhold.de/websps](https://oliverweinhold.de/websps)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
  - [SPS Class](#sps-class)
  - [Helper Functions](#helper-functions)
- [Supported IL Commands](#Supported-IL-Commands)
- [Examples](#examples)
- [License](#license)
- [Author](#Author)
- [Support](#Support)
- [Contributions](#Contributions)

## Installation

To include `WebSPS.js` in your project, you can download the source code from GitHub and include it as a module in your JavaScript environment.

```bash
git clone https://github.com/OliverWeinhold/WebSPS.git
```

Import the `SPS` class into your JavaScript file:

```javascript
import { SPS } from './path/to/WebSPS.js';
```

## Usage

### Creating an SPS Instance

You can create an SPS instance by initializing it with the desired number of input, output, and flag registers. By default, each of these is set to 64.

```javascript
const mySPS = new SPS(64, 64, 64);
```

### Loading IL Code

To load IL code into the SPS, use the `loadCode` method. This method converts the IL code into JavaScript that can be executed by the SPS.

```javascript
const ILCode = `
  U E1
  = A1
  UN E2
  = A2
`;

const result = mySPS.loadCode(ILCode);
if (result === 0) {
  console.log('Code loaded successfully');
} else {
  console.error('Failed to load code');
}
```

### Running the SPS

To start the SPS, call the `start` method. You can also pause, resume, or stop the SPS using the corresponding methods.

```javascript
mySPS.start();
mySPS.pause();
mySPS.stop();
```

### Setting Inputs and Retrieving Outputs

Inputs and outputs can be set and retrieved using the provided setter and getter methods.

```javascript
mySPS.setInputs([1, 0, 1, 1, ...]);
const outputs = mySPS.getOutputs();
console.log(outputs);
```

## API Reference

### SPS Class

#### Constructor

```javascript
new SPS(Inputs = 64, Outputs = 64, Flags = 64)
```

- **Inputs**: Number of input registers (default: 64).
- **Outputs**: Number of output registers (default: 64).
- **Flags**: Number of flag registers (default: 64).

#### Methods

- **`loadCode(ImputCode, errorCallback)`**: Loads IL code into the SPS.
  - **ImputCode**: A string or array of IL code strings.
  - **errorCallback**: A function to handle errors during code loading.
  - **Returns**: `0` if the code is valid, `-1` otherwise.

- **`start()`**: Starts the SPS.
  - **Returns**: `0` if the SPS starts successfully, `-1` if already running.

- **`stop()`**: Stops the SPS and resets all registers.
  - **Returns**: `0` on successful stop.

- **`pause()`**: Pauses the SPS.
  - **Returns**: `0` on successful pause.

- **`setCycleTime(delay)`**: Sets the cycle time in milliseconds (default: 10ms).
  - **delay**: The time in milliseconds between each SPS cycle (10-1000ms).
  - **Returns**: `0` if the cycle time is set successfully, `-1` otherwise.

- **`setFlags(flags)`**: Sets the internal flag registers.
  - **flags**: An array of flag values.
  - **Returns**: `0` on successful update.

- **`setInputs(inputs)`**: Sets the input registers.
  - **inputs**: An array of input values.
  - **Returns**: `0` on successful update.

- **`getInputs()`**: Retrieves the current state of the input registers.
  - **Returns**: An array of input states.

- **`getFlags()`**: Retrieves the current state of the flag registers.
  - **Returns**: An array of flag states.

- **`getOutputs()`**: Retrieves the current state of the output registers.
  - **Returns**: An array of output states.

- **`getState()`**: Gets the current state of the SPS.
  - **Returns**: `0` for stopped, `1` for running, `2` for paused.

- **`getRuntimeCounter()`**: Gets the current runtime counter.
  - **Returns**: The number of times the runtime has been called.

- **`dataAvailable()`**: Checks if the output registers were updated after an input change.
  - **Returns**: `true` if the output registers were updated.

## Supported IL Commands

The following IL commands are currently supported by the SPS implementation:

- **Logical Operations**:
  - `U`: AND operation
  - `O`: OR operation
  - `X`: XOR operation
  - `NOT`: NOT operation
  - `UN`: AND NOT operation
  - `ON`: OR NOT operation

- **Instructions**:
  - `=`: Assigns the result of the logic operation to the specified operand
  - `S`: Sets the specified operand to true
  - `R`: Resets the specified operand to false

- **Operands**:
  - `E`: Input register
  - `A`: Output register
  - `M`: Flag register

- **Brackets**:
  - `(`: Opens a new logical block
  - `)`: Closes a logical block

_Further commands (like timers, XN) are planned_

## Examples

### Basic Example

```javascript
const mySPS = new SPS(8, 8, 8);

const ILCode = `
  U E1
  = A1
  UN E2
  S A2
`;

mySPS.loadCode(ILCode);
mySPS.setInputs([1, 0, 1, 0, 0, 0, 0, 0]);
mySPS.start();

console.log(mySPS.getOutputs());
```

### Advanced Example

You can handle more complex automation tasks by combining multiple networks of IL code.

```javascript
const ILCodeArray = [
  `U E1
  = A1
  \`,
  \`
  UN E2
  R A1
  `
, 
`S M3`];

mySPS.loadCode(ILCodeArray);
mySPS.setInputs([1, 1, 0, 0, 0, 0, 0, 0]);
mySPS.start();

console.log(mySPS.getOutputs());
```

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

## Author

- [Oliver Weinhold](https://oliverweinhold.de/)

## Support

Please note that the maintenance of this library is not continuous and not guaranteed. For support, feature requests, or bug reporting, please use GitHub.


## Contributions

Contributions are welcome! Feel free to open a pull request or issue on GitHub!

