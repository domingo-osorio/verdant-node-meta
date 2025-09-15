const array_to_pairs =  initialArray => initialArray.reduce(function(result, value, index, array) {
  if (index % 3 === 0)
    result.push(array.slice(index, index + 2));
  return result;
}, []);
function description(data) {
  let row = data[0];
  //Logger.log(row);
  if (row[0].startsWith("~")){
    // replace with referenced Id
    const sheet = SpreadsheetApp.getActiveSheet();
    const values = sheet.getSheetValues(1,1,sheet.getLastRow(),sheet.getLastColumn());
    //Logger.log(values);
    row[0] = values.find(x => x[0] == row[0].substring(1))[2];
    // test case
    //row[0] ="Add +~miasma_perc~% miasma";
  }
  else if (!row[0].includes("~")){ return row[0]; }
  const variables = row.slice(1);
  // if (variables.length %2 != 0) return "❌ must define name variable followed by their value";
  let text = row[0];
  array_to_pairs(variables).map(([var_name, var_value]) => {
    Logger.log(var_value);
    text = text.replaceAll(`~${var_name}~`,( typeof var_value === "string" && var_value.startsWith("&")) ? var_value.split(" ").slice(1).join(" ") : var_value);
    });
  return text;
}
function eval_ref(instruction) {
  Logger.log(instruction);
  if (typeof instruction !== "string") return instruction;
  if (typeof instruction === "string" && instruction.startsWith("&")){
    const instruction_split = instruction.split(" ");
    let [ss_name, value_reference] = [instruction_split[0].substring(1), instruction_split.slice(1).join(" ")];
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(ss_name);
    
    Logger.log(sheet);
    const ss_values = sheet.getSheetValues(1,1,sheet.getLastRow(),sheet.getLastColumn());
    const row = ss_values.find(x => x[1] == value_reference);
    if (!row) return "ERROR";
    return `[\\\"${ss_name}\\\", ${row[0]}]`;
  }
};

function preview_waterline(code) {
  // Positions encoded as [y, x] so its [0] and [1] remains in order when accessing.
  let nums;
  const [_1,_2,_3,_4,_5,_6,_7,_8,_9,_10] = (nums = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣", "🔟"]);
  const [empty, U, D, L, R] = ["⬜️","👆🏼","👇🏼","👈🏼","👉🏼"];
  let render = [
    [empty,empty,empty,empty,empty,],
    [empty,empty,empty,empty,empty,],
    [empty,empty,empty,empty,empty,],
    [empty,empty,empty,empty,empty,],
    [empty,empty,empty,empty,empty,],
  ]
  const [p0 , p1 , p2 , p3, p4] = [[0,0],[0,1],[0,2],[0,3],[0,4]];
  const [p15,               p5] = [[1,0],                  [1,4]];
  const [p14,               p6] = [[2,0],                  [2,4]];
  const [p13,               p7] = [[3,0],                  [3,4]];
  const [p12, p11, p10, p9, p8] = [[4,0],[4,1],[4,2],[4,3],[4,4]];

  const pmap = [p0,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15];
  const _code = code.split(":");
  const trigger_num = nums[_code[0]-1];
  const starting_point = Number(_code[1]);
  const movement = {
    U: [[-1,  0], U],
    D: [[ 1,  0], D],
    L: [[ 0, -1], L],
    R: [[ 0,  1], R],
  }
  const path = _code[2].split("").map(x => movement[x]);
  render[pmap[starting_point][0]][pmap[starting_point][1]] = trigger_num;

  path.reduce(([p_y, p_x],[[delta_y,delta_x], _symbol]) => {
    const new_pos = [p_y + delta_y, p_x + delta_x];
    render[new_pos[0]][new_pos[1]] = _symbol;
    return new_pos;
  }, pmap[starting_point]);
  Logger.log(render);
  return render.map(line => line.join("")).join("\n");
}
