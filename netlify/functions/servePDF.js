const { google } = require("googleapis");

const FOLDER_ID = "1R_vvQXfNaTqKVQFFe57-VyMlJ3AqfzEU";

exports.handler = async (event) => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GDRIVE_CLIENT_EMAIL,
        private_key: process.env.GDRIVE_PRIVATE_KEY,
      },
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const drive = google.drive({ version: "v3", auth });

    const pageNumber = event.queryStringParameters?.page;

    // If no page provided → return list of pages
    if (!pageNumber) {
      const list = await drive.files.list({
        q: `'${FOLDER_ID}' in parents and mimeType contains 'image/jpeg'`,
        fields: "files(id, name)",
      });

      const sorted = list.data.files.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/));
        const numB = parseInt(b.name.match(/\d+/));
        return numA - numB;
      });

      return {
        statusCode: 200,
        body: JSON.stringify(sorted),
      };
    }

    // If page number provided → return that image
    const list = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and name contains 'page-${pageNumber}'`,
      fields: "files(id)",
    });

    if (!list.data.files.length) {
      return { statusCode: 404, body: "Page not found" };
    }

    const fileId = list.data.files[0].id;

    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/jpeg",
      },
      body: Buffer.from(response.data).toString("base64"),
      isBase64Encoded: true,
    };

 } catch (err) {
  return {
    statusCode: 500,
    body: JSON.stringify({
      message: err.message,
      stack: err.stack
    })
  };
}
};
