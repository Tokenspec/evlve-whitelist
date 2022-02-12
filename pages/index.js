import { css } from "@emotion/react"
import { useEffect } from "react"
import { useAbuse } from 'use-abuse'
import { useRouter } from 'next/router'
import Web3 from 'web3'

function clearAllStorage() {
  localStorage.removeItem("evlve-whitelisted");
  localStorage.removeItem("meta-auth-signature");
  localStorage.removeItem("discord-auth-username");
  localStorage.removeItem("meta-auth-account");
}

export default function Home() {
  const router = useRouter();
  const [state, setState] = useAbuse({ discordApproved: false, metamaskApproved: false, disableDiscord: true, disableMetamask: true, signature: null, account: null, username: null ,id:null})
  const { discordApproved, metamaskApproved, disableDiscord, disableMetamask, signature, account, username,id} = state
  const msg = "Do you wish to be whitelisted? 😊"
  useEffect(() => {
    // clearAllStorage()
    if (discordApproved && metamaskApproved) {
      const alreadyWhitelisted = localStorage.getItem("evlve-whitelisted")
      if (alreadyWhitelisted !== "wl-degen") {
        fetch('/api/whitelist', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ signature, account, username,id })
        }).then(res => res.json()).then(res => {
          const { message } = res
          if (message === "whitelisted") {
            localStorage.setItem("evlve-whitelisted", "wl-degen")
          }
        })
      }
    }
  }, [discordApproved, metamaskApproved])
  useEffect(() => {
    const username = localStorage.getItem("discord-auth-username")
    const id = localStorage.getItem("discord-auth-id")
    if (username && id) setState({ discordApproved: true, disableDiscord: false, username: username,id: id})
    else setState({ disableDiscord: false })
    if (window.ethereum) {
      const signature = localStorage.getItem("meta-auth-signature")
      const account = localStorage.getItem("meta-auth-account")
      setState({ signature: signature, account: account })
      const web3 = new Web3(window.ethereum)
      if (signature && account) {
        try {

          web3.eth.personal.ecRecover(msg, signature).then(signingAddress => {
            if (account === signingAddress) {
              setState({ metamaskApproved: true, disableMetamask: false })
            }
          })
        }
        catch {
          setState({ disableMetamask: false })
        }
      } else {
        setState({ disableMetamask: false })
      }
    } else {
      setState({ disableMetamask: false })
    }
    const fragment = new URLSearchParams(window.location.search);
    router.replace('/', undefined, { shallow: true });
    const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];
    if (accessToken) {
      fetch('https://discord.com/api/users/@me', {
        headers: {
          authorization: `${tokenType} ${accessToken}`,
        },
      }, [])
        .then(result => result.json())
        .then(response => {
          console.log(response)
          const { username, discriminator,id} = response;
          if (username) {
            setState({ discordApproved: true, username: username ,id:id})
            localStorage.setItem("discord-auth-username", username)
            localStorage.setItem("discord-auth-id", id)
          }
        })
        .catch(console.error);
    }
  }, [])

  const signMessage = async () => {
    try {
      if (!window.ethereum)
        throw new Error("No crypto wallet found, please install Metamask:https://metamask.io/")
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const web3 = new Web3(window.ethereum)
      const account = accounts[0];
      const signature = await web3.eth.personal.sign(msg, account);
      const signingAddress = await web3.eth.personal.ecRecover(msg, signature)
      if (account === signingAddress) {
        setState({ metamaskApproved: true, signature: signature, account: account })
        localStorage.setItem("meta-auth-signature", signature)
        localStorage.setItem("meta-auth-account", account)
      }
    } catch (e) {
      // console.log(e)
    }
  }
  return (
    <div className="page" css={emotion()}>
      <div className="bg"></div>
      <img className="logo" src="logo.svg" alt="logo" />
      <h1 className="title">EVLVE</h1>
      <button className="btn" disabled={disableMetamask || metamaskApproved} onClick={() => signMessage()} ><img src="/metamask.svg" alt="metamask" />Metamask</button>
      <button className="btn" disabled={disableDiscord || discordApproved}><a href={process.env.NEXT_PUBLIC_DISCORD_LINK}><img src="/discord.svg" alt="discord" />Discord</a></button>
      {!disableDiscord && !disableMetamask && metamaskApproved && discordApproved && <h2 className="message">Whitelisted Succesfully </h2>}
    </div>
  )
  function emotion() {
    return css`
      .page&{
        width:100vw;
        height:100vh;
        position: relative;
        min-height: 800px;
        min-width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        .bg{
          position: absolute;
          z-index: -1;
          background-size: 100%;
          background-image: url('/bg.png');
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center;
          width:100%;
          height:100%;
        }
        .logo{
          margin-top:15vh;
          width:200px;
          margin-bottom: 10px;
        }
        .title{
          text-align: center;
          font-size: 40px;
          font-family:Xirod;
          color:white;
          margin-bottom:40px;
        }
        .btn{
          font-family: Xirod;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 16px;
          margin-bottom:40px;
          color:white;
          background-size: 100%;
          background: linear-gradient( rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.5) ), url('/button.png');
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center;
          width:240px;
          height:70px;
          min-height:70px;
          border-radius: 6px;
          border:none;
          a{
            display: flex;
            align-items: center;
            justify-content: center;
          }
          :disabled{
            pointer-events: none;
            filter:brightness(0.6);
            a{
              pointer-events: none;
            }
          }
          :hover{
            transform: scale(1.05);
          }
          :active{
            filter:brightness(0.85);
            transform: scale(1.00);
          }
          img{
            filter:drop-shadow(-1px 1px 1px rgb(53, 53, 53));
            width:45px;
            margin-right:10px;
          }
        }
        .message{
          text-align: center;
          font-family:Xirod;
          color:white;
        }
      }
    `
  }
}
