import fs from 'fs';
import path from 'path';

export function getProjectVersion() {
  try {
    let jsonContent = fs.readFileSync(path.resolve(process.cwd(), 'package.json')).toString();
    let json = JSON.parse(jsonContent);
    return json.version;
  } catch (error) {
    return undefined;
  }
}
