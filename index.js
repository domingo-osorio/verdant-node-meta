import {run as spreadsheet_to_game_content_run} from './00_spreadsheet_to_game_content_dropdown_as_entities.js';


const game_content = await spreadsheet_to_game_content_run();
print(game_content);
