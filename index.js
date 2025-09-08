import {run as spreadsheet_to_game_content_run} from './00_spreadsheet_to_game_content_dropdown_as_entities.js';
import {run as game_content_to_meta_programming} from './01_game_content_to_meta_programming.js';


const game_content = await spreadsheet_to_game_content_run();
const meta_programming = await game_content_to_meta_programming(game_content);
//print.json(meta_programming["properties"]);
