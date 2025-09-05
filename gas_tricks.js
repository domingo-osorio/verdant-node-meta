
//How to retrieve the addresses before being processed in the arguments
function onEdit(e) {
  Logger.log(Object.keys(e));
  var match = /=variadic\(([^)]+)\)/i.exec(e.value)[1]; // detect the call and retrieve the parameters as string (having addressed before evaluated)
  if (match != null)
    Logger.log(match); // log the addresses to check
    //e.range.setValue(match); // set the addresses from the argument as values
}

function variadic() {
  Logger.log("I got called");
  const range = arguments; // here the arguments have been already processes and they are not addresses anymore
  Logger.log("it works"+ JSON.stringify(range));
}
