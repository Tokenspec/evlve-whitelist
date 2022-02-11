// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Client, Intents } from 'discord.js';
export default async function handler({ query }, res) {
	const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
	client.login(process.env.BOT_TOKEN)
	client.on('ready', async () => {
		const guild=client.guilds.cache.get("939154314948116510")
		const { code } = query;
		if (code) {
			try {
				const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
					method: 'POST',
					body: new URLSearchParams({
						client_id: process.env.DISCORD_CLIENT_ID,
						client_secret: process.env.DISCORD_CLIENT_SECRET,
						code,
						grant_type: 'authorization_code',
						redirect_uri: process.env.REDIRECT_URL,
						scope: 'identify',
					}),
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				});

				const oauthData = await oauthResult.json();
				const userResult = await fetch('https://discord.com/api/users/@me', {
					headers: {
						authorization: `${oauthData.token_type} ${oauthData.access_token}`,
					},
				});
				// console.log(oauthData)
				const user=await userResult.json();
				if(await guild.members.fetch(user.id)){
					const {access_token,refresh_token,expires_in,token_type} = oauthData
					res.writeHead(302, { // or 301
						Location: `/?access_token=${access_token}&token_type=${token_type}`,
						// Location:"/"
						
					});
					res.end();
				}else{
					res.writeHead(302, { // or 301
						Location:"/"
					});
					res.end();
				}
				// console.log(user)
			} catch (error) {
				res.writeHead(302, { 
					Location:"/"
				});
				res.end();
			}
		}
	});

	
}
