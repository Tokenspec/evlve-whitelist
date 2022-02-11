import Web3 from 'web3'
import { google } from 'googleapis'


export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
export async function getAuthToken() {
  if (typeof window !== 'undefined') {
    throw new Error('NO SECRETS ON CLIENT!')
  }

  const { privateKey } = JSON.parse(process.env.GOOGLE_PRIVATE_KEY || '{ "privateKey": null }')
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
    projectId: process.env.GOOGLE_PROJECTID,
    credentials: {
      private_key: privateKey,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
    },
  })
  const authToken = await auth.getClient()
  return authToken
}
export default async function handler(req, res) {
    const web3 = new Web3(`https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`)
    const { signature, account, username } = req.body
    const msg = "Do you wish to be whitelisted? 😊"
    const signingAddress = await web3.eth.accounts.recover(msg, signature)
    if (signingAddress.toLowerCase() === account.toLowerCase()) {
        const auth = await getAuthToken()
        const sheets = google.sheets({ version: 'v4', auth })
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range:`Sheet1!F2`
        });
        const count = Number(response.data.values[0][0]);
        const promises=[]
        promises.push(new Promise((resolve, reject) => {
            sheets.spreadsheets.values.update(
                {
                    auth:auth,
                    range: `Sheet1!A${count + 3}:B${count + 3}`,
                    spreadsheetId: process.env.SHEET_ID,
                    valueInputOption: "USER_ENTERED",
                    resource: { range: `Sheet1!A${count + 3}:B${count + 3}`, majorDimension: "ROWS", values: [[username,account]] },
                },
                (err, resp) => {
                    if (err) {
                        console.log("Data Error :", err);
                        reject(err);
                    }
                    resolve(resp);
                }
            );
        }))
        promises.push(new Promise((resolve, reject) => {
            sheets.spreadsheets.values.update(
                {
                    range: `Sheet1!F2`,
                    auth:auth,
                    spreadsheetId: process.env.SHEET_ID,
                    valueInputOption: "USER_ENTERED",
                    resource: { range: `Sheet1!F2`, majorDimension: "ROWS", values: [[count+1]] },
                },
                (err, resp) => {
                    if (err) {
                        console.log("Data Error :", err);
                        reject(err);
                    }
                    resolve(resp);
                }
            );
        }))
        Promise.all(promises).then(
            res.status(200).json({ message: "whitelisted" })
        )
    }else{
        res.status(200).json({ message: "Bad signature" })
    }
    
}
