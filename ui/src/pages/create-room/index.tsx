import { PublicKey } from "o1js";
import { FormEvent, useEffect, useState } from "react";

export default function CreateRoom() {
    const [accounts, setAccounts] = useState([]);
    const [display, setDisplay] = useState("");

    const [contractAddress, setContractAddress] = useState("");
    const [publicAddress, setPublicAddress] = useState("");
    
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

    async function create_room_handler(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        let puk: PublicKey
        let zkapp_address: PublicKey

        try {
            puk = PublicKey.fromBase58(publicAddress);
            zkapp_address = PublicKey.fromBase58(contractAddress);
        } catch (error) {
            alert("invalid public address");

            return
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
                <div className="text-center">
                <h1 className="mb-5 text-2xl font-bold leading-none tracking-tight text-[#023047] md:text-3xl lg:text-5xl dark:text-white">Create room</h1>
                <p className="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">the address of the person you will speak to will be kept confidential</p>
                </div>
                
                <form onSubmit={create_room_handler} className="max-w-xl w-1/2 mx-auto mt-10">
                    <div className="mb-5">
                        <label htmlFor="contract_address" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contract address</label>
                        <input value={contractAddress} onChange={(e) => setContractAddress(e.currentTarget.value)} type="text" id="contract_address" name="contract_address" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="B62qjt3tC8RoRtrsZiz8yX8rXweUC1hR8wqgy8QMThwMBcdWzZupLR2" required />
                    </div>
                    <div className="mb-5">
                        <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Public address</label>
                        <input value={publicAddress} onChange={(e) => setPublicAddress(e.currentTarget.value)} type="text" id="address" name="address" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="B62qjt3tC8RoRtrsZiz8yX8rXweUC1hR8wqgy8QMThwMBcdWzZupLR2" required />
                    </div>
                    <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Create room</button>
                </form>
            </main>
        </>
    )
}