import { useState, useEffect, MouseEventHandler, FormEventHandler } from "react"
import "./App.css"

import { useRef } from "react"
import { Magic } from "magic-sdk"
// @ts-ignore
import { CosmosExtension } from "@magic-ext/cosmos"

const magic = new Magic("pk_live_C4C7EC93DE5205AF", {
  extensions: [
    new CosmosExtension({
      rpcUrl: "https://rest.cosmos.directory/osmosis",
    }),
  ],
})

export default function App() {
  const inputRef = useRef<HTMLInputElement>()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>()
  const [username, setUsername] = useState<string>()
  const [metadata, setMetadata] = useState<any>()

  useEffect(() => {
    magic.user.isLoggedIn().then(async (magicIsLoggedIn: boolean) => {
      setIsLoggedIn(magicIsLoggedIn)
      if (magicIsLoggedIn) {
        const metadata: any = await magic.user.getMetadata()
        setUsername(metadata.username)
        setMetadata(metadata)
      } else {
        setMetadata(null)
      }
    })
  }, [isLoggedIn])

  const doLogin: FormEventHandler = async (e) => {
    e.preventDefault()
    const email = inputRef.current?.value || "raykyri@gmail.com"
    const redirectURI = undefined // document.location.origin
    try {
      await magic.auth.loginWithMagicLink({ email, redirectURI, showUI: true })
      const metadata: any = await magic.user.getMetadata()
      setUsername(metadata.username)
      setMetadata(metadata)
    } catch (err) {
      console.error(err)
    }
  }

  const doSign: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault()
    try {
      const metadata = await magic.user.getMetadata()

      const message = [
        {
          typeUrl: "/cosmos.bank.v1beta1.MsgSend",
          value: {
            fromAddress: metadata.publicAddress,
            toAddress: metadata.publicAddress,
            amount: [
              {
                amount: String(1),
                denom: "atom",
              },
            ],
          },
        },
      ]
      const fee = {
        amount: [{ denom: "uatom", amount: "500" }],
        gas: "200000",
      }

      const signTransactionResult = await magic.cosmos.sign(message, fee)
      console.log(signTransactionResult)
    } catch (err) {
      console.error(err)
      alert("Error signing transaction")
    }
  }

  return (
    <main>
      <form onSubmit={doLogin}>
        <div>
          <input type="text" ref={inputRef as any} placeholder="Email" />
          <button type="submit">Login</button>
        </div>
        <div>
          Login: {isLoggedIn} {username} {JSON.stringify(metadata)}
        </div>
        <div>
          <button onClick={doSign}>Sign Tx</button>
        </div>
      </form>
    </main>
  )
}
