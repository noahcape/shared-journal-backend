const readLine = require("readline").createInterface({
  input: require("fs").createReadStream("./update_content.txt"),
});

const parseContent = async () => {
  await readLine.on("line", (line) => line);
};
