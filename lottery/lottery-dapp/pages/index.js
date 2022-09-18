import Head from 'next/head'
import styles from '../styles/Home.module.css'
import 'bulma/css/bulma.css'
import Web3 from 'web3'
import LotteryContract from '../blockchain/lottery'
import { useState, useEffect } from 'react'

export default function Home() {
  const [web3, setWeb3] = useState()
  const [address, setAddress] = useState()
  const [lcContract, setLcContract] = useState()
  const [lotteryPot, setLotteryPot] = useState()
  const [players, setPlayers] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lotteryHist, setLotteryHist] = useState('')
  const [lotteryId, setLotteryId] = useState()

  useEffect(() => {
    updateState()
  },[lcContract])

  const updateState = () => {
    if(lcContract) getPot()
    if(lcContract) getPlayers()
    if(lcContract) getLotteryId()
  }


  const getPot = async () => {
    const pot = await lcContract.methods.getBalance().call()
    setLotteryPot(web3.utils.fromWei(pot,'ether'))
  }

  const getPlayers = async () => {
    const pl = await lcContract.methods.getPlayers().call()
    setPlayers(pl)

  }

  const enterLotteryHandler = async () => {
    try{
      await lcContract.methods.enter().send(
      {
        from: address,
        value: '12000000000000000',
        gas: 300000,
        gasPrice:null
      })
      document.querySelector(".winners").innerHTML = ""
      updateState()
    } catch(err){
      setError(err.message);
    }
  }

  const getHistory = async (id) => {
    document.querySelector(".winners").innerHTML = ""
    for (let i = parseInt(id); i > 0; i --){
      const winnerAddress = await lcContract.methods.lotteryHistory(i).call()
      const historyObj = {}
      historyObj.id = i
      historyObj.address = winnerAddress
      setLotteryHist( lotteryHist => [...lotteryHist, historyObj])
    }
    //const history = await lcContract.methods.lotteryHistory().call()
    //setLotteryHist(history)
    //console.log(JSON.parse(history))

  }

  const getLotteryId = async () => {
    const lotId = await lcContract.methods.lotteryId().call()
    setLotteryId(lotId)
    await getHistory(lotId)
    console.log(JSON.stringify(lotteryHist))
  }

  const getOwner = async () => {
    const owner = await lcContract.methods.getOwner().call()
    return owner
  }

  const pickWinnerHandler = async () => {
    try{
      await lcContract.methods.payWinner().send(
      {
        from: address,
        gas: 300000,
        gasPrice:null
      })
      const winner =await lcContract.methods.lotteryHistory(lotteryId).call()
      setSuccess(`Winner is ${winner}`)
      document.querySelector(".winners").innerHTML = ""
      updateState()
    } catch(err){
      setError(err.message);
    }
  }

  const connectWalletHandler = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'){
      try{
        document.querySelector(".winners").innerHTML = ""
        await window.ethereum.request({method:"eth_requestAccounts"})
        const web3 = new Web3(window.ethereum)
        setWeb3(web3)
        const accounts = await web3.eth.getAccounts()
        setAddress(accounts[0])
        console.log(address) //test
        // created web3 instance and setState on it, also got account 1 from connected metamask instance
        const lc = LotteryContract(web3)
        setLcContract(lc)
        // created local contract copy from abii
        window.ethereum.on('accountsChanged', async () => {
          const accounts = await web3.eth.getAccounts()
          console.log(accounts[0])
          setAddress(accounts[0])
        })

      } catch(err){console.log(err.message);}
    } else {
      console.log('Please install Metamask')
    }
  }
  return (
    <div>
      <Head>
        <title>Ether Lottery</title>
        <meta name="description" content="Ethereum Lottery dApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <nav className="navbar">
          <div className="container">
            <div className="navbar-brand">
              <h1>Ether Lottery</h1>
            </div>
            <div className="navbar-end">
              <button onClick={connectWalletHandler} className="button is-link">Connect Wallet</button>
            </div>
          </div>
        </nav>

        <div className="container">
          <section className="mt-t">
            <div className="columns">
              <div className="column is-two-thrid">
                <div className="mt-5">
                  <p>Enter the lottery by sending 0.01 Ether</p>
                  <button onClick={enterLotteryHandler} className="button is-large is-link is-light">Play now</button>
                </div>

                <div className="mt-6">
                  <p><b>Admin only:</b> Pick Winner</p>
                  <button onClick={pickWinnerHandler} className="button is-large is-primary is-light">Pick Winner</button>
                </div>
                <section>
                  <div className="container has-test-danger mt-6">
                    <p>{error}</p>
                  </div>
                </section>
                <section>
                  <div className="container has-test-danger mt-6">
                    <p>{success}</p>
                  </div>
                </section>
              </div>
              <div className={`${styles.lotteryinfo} column is-one-third`}>
                <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Lottery History</h2>
                        <div className="winners">
                        {
                          (lotteryHist && lotteryHist.length > 0) && lotteryHist.map((item, index) => {
                            if (lotteryId != item.id){
                            return (
                              <div key={index} className="history-entry">
                                <div>Lottery #{item.id} winner: </div>
                                <div><a href={`https://etherscan.io/address/${item.address}`} target="_blank">{item.address}</a></div>
                              </div>
                            )}
                          })
                        }
                      </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Players ({players.length})</h2>
                        <div>
                          <ul className="address ml-0">

                          {(players && players.length > 0) ? players.map((player, index) => {
                              return(
                              <li key={index}>
                                <a href={`https://etherscan.io/address/${player}`} target="_blank">{player}</a>
                              </li>)
                            }) : console.log(players)
                          }
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Pot</h2>
                        <p> {lotteryPot} Ether</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </div>
      </main>
      <footer className={styles.footer}>
        <p>&copy; 2022 Block Explorer</p>
      </footer>
    </div>
  )
}
