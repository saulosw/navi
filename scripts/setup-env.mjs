import { copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
for (const path of ['.env', 'apps/desktop/.env']) {
  try {
    await copyFile(`${path}.example`, path, constants.COPYFILE_EXCL);
    console.info(`Created ${path}`);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    console.info(`Preserved ${path}`);
  }
}
