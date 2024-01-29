import { FormEvent, useEffect, useState } from "react";
import Image from 'next/image';
import { io } from "socket.io-client";

import './reactCOIServiceWorker';
import ZkappWorkerClient from '../../zkappWorkerClient';
import { PublicKey, Field, MerkleMap, MerkleTree, Poseidon } from 'o1js';
import styles from '../styles/Home.module.css';
import { Checker, Prover } from "../../../../../contracts/src/Prover";

let transactionFee = 0.1;
const ZKAPP_ADDRESS = '';

const socket = io("http://localhost:3001");

type JsonProof = {
    publicInput: string[];
    publicOutput: string[];
    maxProofsVerified: 0 | 1 | 2;
    proof: string;
};

export default function Whisper() {
    const [accounts, setAccounts] = useState([]);
    const [display, setDisplay] = useState("");

    const [messageInput, setMessageInput] = useState("");

    const [proofState, setProofState] = useState(null as null | JsonProof);
    const [checker, setChecker] = useState(new Checker(Field(0), Field(0)));

    useEffect(() => {
        const c = new Checker(Field(100), Field(100));
        setChecker(c);

        (async () => {
            const p = await Prover.baseCase(c);

            setProofState(p.toJSON());
        })();

        socket.on("message", (message) => {
            console.log(message);
        });
    }, [socket]);
    
    useEffect(() => {
        (async () => {
            if (accounts.length !== 0) {
                // Show first 6 and last 4 characters of user's Mina account.
                const d = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
                setDisplay(d);
            } else {
                const acs = await window.mina.getAccounts();
                setAccounts(acs);
            }
        })();
    }, [accounts]);

    async function connect_wallet() {
        try {
            // Accounts is an array of string Mina addresses.
            const acs = await window.mina.requestAccounts();
            setAccounts(acs);

            // Show first 6 and last 4 characters of user's Mina account.
            const d = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
            setDisplay(d);

            console.log(display)
        } catch (err) {
            // If the user has a wallet installed but has not created an account, an
            // exception will be thrown. Consider showing "not connected" in your UI.
            console.log(err.message);
        }
    }

    async function send_message(event: FormEvent<HTMLFormElement>) {
        if (proofState) {
            socket.emit("message", proofState);
        }
    }

    const [state, setState] = useState({
        zkappWorkerClient: null as null | ZkappWorkerClient,
        hasWallet: null as null | boolean,
        hasBeenSetup: false,
        accountExists: false,
        currentNum: null as null | Field,
        publicKey: null as null | PublicKey,
        zkappPublicKey: null as null | PublicKey,
        creatingTransaction: false
      });
    
      const [displayText, setDisplayText] = useState('');
      const [transactionlink, setTransactionLink] = useState('');
    
      // -------------------------------------------------------
      // Do Setup
    
      useEffect(() => {
        async function timeout(seconds: number): Promise<void> {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, seconds * 1000);
          });
        }
    
        (async () => {
          if (!state.hasBeenSetup) {
            setDisplayText('Loading web worker...');
            console.log('Loading web worker...');
            const zkappWorkerClient = new ZkappWorkerClient();
            await timeout(5);
    
            setDisplayText('Done loading web worker');
            console.log('Done loading web worker');
    
            await zkappWorkerClient.setActiveInstanceToBerkeley();
    
            const mina = (window as any).mina;
    
            if (mina == null) {
              setState({ ...state, hasWallet: false });
              return;
            }
    
            const publicKeyBase58: string = (await mina.requestAccounts())[0];
            const publicKey = PublicKey.fromBase58(publicKeyBase58);
    
            console.log(`Using key:${publicKey.toBase58()}`);
            setDisplayText(`Using key:${publicKey.toBase58()}`);
    
            setDisplayText('Checking if fee payer account exists...');
            console.log('Checking if fee payer account exists...');
    
            const res = await zkappWorkerClient.fetchAccount({
              publicKey: publicKey!
            });
            const accountExists = res.error == null;
    
            await zkappWorkerClient.loadContract();
    
            console.log('Compiling zkApp...');
            setDisplayText('Compiling zkApp...');
            await zkappWorkerClient.compileContract();
            console.log('zkApp compiled');
            setDisplayText('zkApp compiled...');
    
            const zkappPublicKey = PublicKey.fromBase58(ZKAPP_ADDRESS);
    
            await zkappWorkerClient.initZkappInstance(zkappPublicKey);
    
            console.log('Getting zkApp state...');
            setDisplayText('Getting zkApp state...');
            const fetch = await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
            console.log(fetch);
            const currentNum = await zkappWorkerClient.getNum();
            console.log(`Current state in zkApp: ${currentNum}`);
            setDisplayText('');
    
            setState({
              ...state,
              zkappWorkerClient,
              hasWallet: true,
              hasBeenSetup: true,
              publicKey,
              zkappPublicKey,
              accountExists,
              currentNum
            });
          }
        })();
      }, []);
    
      // -------------------------------------------------------
      // Wait for account to exist, if it didn't
    
      useEffect(() => {
        (async () => {
          if (state.hasBeenSetup && !state.accountExists) {
            for (;;) {
              setDisplayText('Checking if fee payer account exists...');
              console.log('Checking if fee payer account exists...');
              const res = await state.zkappWorkerClient!.fetchAccount({
                publicKey: state.publicKey!
              });
              const accountExists = res.error == null;
              if (accountExists) {
                break;
              }
              await new Promise((resolve) => setTimeout(resolve, 5000));
            }
            setState({ ...state, accountExists: true });
          }
        })();
      }, [state.hasBeenSetup]);
    
      // -------------------------------------------------------
      // Send a transaction
    
      const onSendTransaction = async () => {
        setState({ ...state, creatingTransaction: true });
    
        setDisplayText('Creating a transaction...');
        console.log('Creating a transaction...');
    
        await state.zkappWorkerClient!.fetchAccount({
          publicKey: state.publicKey!
        });
    
        await state.zkappWorkerClient!.createUpdateTransaction();
    
        setDisplayText('Creating proof...');
        console.log('Creating proof...');
        await state.zkappWorkerClient!.proveUpdateTransaction();
    
        console.log('Requesting send transaction...');
        setDisplayText('Requesting send transaction...');
        const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON();
    
        setDisplayText('Getting transaction JSON...');
        console.log('Getting transaction JSON...');
        const { hash } = await (window as any).mina.sendTransaction({
          transaction: transactionJSON,
          feePayer: {
            fee: transactionFee,
            memo: ''
          }
        });
    
        const transactionLink = `https://berkeley.minaexplorer.com/transaction/${hash}`;
        console.log(`View transaction at ${transactionLink}`);
    
        setTransactionLink(transactionLink);
        setDisplayText(transactionLink);
    
        setState({ ...state, creatingTransaction: false });
      };
    
      // -------------------------------------------------------
      // Refresh the current state
    
      const onRefreshCurrentNum = async () => {
        console.log('Getting zkApp state...');
        setDisplayText('Getting zkApp state...');
    
        await state.zkappWorkerClient!.fetchAccount({
          publicKey: state.zkappPublicKey!
        });
        const currentNum = await state.zkappWorkerClient!.getNum();
        setState({ ...state, currentNum });
        console.log(`Current state in zkApp: ${currentNum.toString()}`);
        setDisplayText('');
      };
    
      // -------------------------------------------------------
      // Create UI elements
    
      let hasWallet;
      if (state.hasWallet != null && !state.hasWallet) {
        const auroLink = 'https://www.aurowallet.com/';
        const auroLinkElem = (
          <a href={auroLink} target="_blank" rel="noreferrer">
            Install Auro wallet here
          </a>
        );
        hasWallet = <div>Could not find a wallet. {auroLinkElem}</div>;
      }
    
      const stepDisplay = transactionlink ? (
        <a href={displayText} target="_blank" rel="noreferrer">
          View transaction
        </a>
      ) : (
        displayText
      );
    
      let setup = (
        <div
          className={styles.start}
          style={{ fontWeight: 'bold', fontSize: '1.5rem', paddingBottom: '5rem' }}
        >
          {stepDisplay}
          {hasWallet}
        </div>
      );
    
      let accountDoesNotExist;
      if (state.hasBeenSetup && !state.accountExists) {
        const faucetLink =
          'https://faucet.minaprotocol.com/?address=' + state.publicKey!.toBase58();
        accountDoesNotExist = (
          <div >
            <span style={{paddingRight: '1rem'}}>Account does not exist.</span>
            <a href={faucetLink} target="_blank" rel="noreferrer">
              Visit the faucet to fund this fee payer account
            </a>
          </div>
        );
      }
    
      let mainContent;
      if (state.hasBeenSetup && state.accountExists) {
        mainContent = (
          <div style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className={styles.center} style={{ padding: 0 }}>
              Current state in zkApp: {state.currentNum!.toString()}{' '}
            </div>
            <button
              className={styles.card}
              onClick={onSendTransaction}
              disabled={state.creatingTransaction}
            >
              Send Transaction
            </button>
            <button className={styles.card} onClick={onRefreshCurrentNum}>
              Get Latest State
            </button>
          </div>
        );
      }    

    return (
        <>
            <div className="flex items-center w-full h-20 px-20">
                <div>
                    <h1 className="font-semibold text-xl text-[#023047]">zk-whisper</h1>
                </div>
                <div className="ml-auto">
                    {
                        (!display) ? <button onClick={connect_wallet} type="button" className="text-[#023047] bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
                            <svg aria-hidden="true" className="w-6 h-5 me-2 -ms-1" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
                            <rect width="100" height="100" fill="#594AF1"/>
                            <path d="M50.0067 18.1C55.6467 18.1 60.5667 19.21 64.7667 21.43C68.9667 23.65 72.2067 26.95 74.4867 31.33C76.8267 35.65 77.9967 40.9 77.9967 47.08V82H66.2967V65.8H33.5367V82H22.0167V47.08C22.0167 40.9 23.1567 35.65 25.4367 31.33C27.7767 26.95 31.0467 23.65 35.2467 21.43C39.4467 19.21 44.3667 18.1 50.0067 18.1ZM66.2967 55.99V46C66.2967 40.18 64.8567 35.8 61.9767 32.86C59.0967 29.86 55.0767 28.36 49.9167 28.36C44.7567 28.36 40.7367 29.86 37.8567 32.86C34.9767 35.8 33.5367 40.18 33.5367 46V55.99H66.2967Z" fill="white"/>
                            </svg>
                            <span className="mt-1">Connect with Auro</span>
                        </button> : <button type="button" className="text-[#023047] bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
                            <span className="mt-1">{display}</span>
                        </button>
                    }
                </div>
            </div>
            <main className="w-full h-full flex flex-col items-center justify-center px-20" style={{ height: "calc(100vh - 5rem)" }}>
                <div className="flex flex-col w-full lg:w-2/3 border rounded-lg" style={{ minHeight: "75%" }}>
                    <div className="flex items-center px-5 flex-none h-10 border-b">
                        <h3 className="mt-1">B62qjt...ZupLR2</h3>
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                        <div className="flex items-start gap-2.5">
                            <Image
                                className="rounded-full"
                                width={32}
                                height={32}
                                src=""
                                alt=""
                            />
                            <div className="flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700">
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Bonnie Green</span>
                                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">11:46</span>
                                </div>
                                <p className="text-sm font-normal py-2.5 text-gray-900 dark:text-white">That's awesome. I think our users will really appreciate the improvements.</p>
                                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">Delivered</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5 ml-auto">
                            <Image
                                className="rounded-full"
                                width={32}
                                height={32}
                                src=""
                                alt=""
                            />
                            <div className="flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 bg-[#023047] rounded-bl-xl rounded-t-xl dark:bg-gray-700">
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                    <span className="text-sm font-semibold text-white dark:text-white">Bonnie Green</span>
                                    <span className="text-sm font-normal text-gray-300 dark:text-gray-400">11:46</span>
                                </div>
                                <p className="text-sm font-normal py-2.5 text-white dark:text-white">That's awesome. I think our users will really appreciate the improvements.</p>
                                <span className="text-sm font-normal text-gray-300 dark:text-gray-400">Delivered</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center flex-none h-12 border-t">
                        <form onSubmit={send_message} className="w-full h-full flex">
                            <input value={messageInput} type="text" name="" id="" className="h-12 w-full pt-1 px-5 outline-none border rounded-b-lg" />
                        </form>
                    </div>
                </div>
            </main>
        </>
    )
}