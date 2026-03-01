const { google } = require("googleapis");

exports.handler = async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GDRIVE_CLIENT_EMAIL,
        private_key: process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const drive = google.drive({ version: "v3", auth });

    const fileId = "1Ufx2mYKG_Qpl9doG52-RlUTfZbpgMi4N"; // your file ID

    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline"
      },
      body: Buffer.from(response.data).toString("base64"),
      isBase64Encoded: true
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: "Error loading PDF"
    };
  }
};
