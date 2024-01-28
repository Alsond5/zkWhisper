import { FormEvent, useEffect, useState } from "react";
import Image from 'next/image';
import { io } from "socket.io-client";

import { Prover, Checker, MessageDetails, Outputs } from "../../../../../contracts/build/src/Prover.js";
import { MyProof } from "../../../../../contracts/build/src/Whisper.js";
import { CircuitString, Encryption, Field, Poseidon, PrivateKey, Proof, PublicKey, SelfProof, Signature } from "o1js";

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