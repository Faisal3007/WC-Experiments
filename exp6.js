// A simple calculator program in Node.js

// Import the 'readline' module to take user input
const readline = require("readline");

// Create an interface for input and output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask the first question
rl.question("Enter the first number: ", (num1) => {
  rl.question("Enter the operator (+, -, *, /): ", (operator) => {
    rl.question("Enter the second number: ", (num2) => {

      // Convert input strings to numbers
      const a = Number(num1);
      const b = Number(num2);
      let result;

      // Perform calculation based on operator
      if (operator === "+") {
        result = a + b;
      } else if (operator === "-") {
        result = a - b;
      } else if (operator === "*") {
        result = a * b;
      } else if (operator === "/") {
        if (b !== 0) {
          result = a / b;
        } else {
          result = "Error: Cannot divide by zero!";
        }
      } else {
        result = "Invalid operator!";
      }

      // Display the result
      console.log(`Result: ${result}`);

      // Close the interface
      rl.close();
    });
  });
});
