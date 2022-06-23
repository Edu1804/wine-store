import {useState } from 'react'
import {ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');
import {
    nftaddress,nftmarketaddress
} from '../config';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import { EtherscanProvider } from '@ethersproject/providers';
import Image from 'next/image';

//this function allow you to create an item (wine bottle)
export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState(null)
    const [formInput, updateFormInput] = useState({price: '', name: '', description:'', barricaTime:'', harvestYear:'', typeGrape:''})
    const router = useRouter();

    async function onChange(e) {
        const file = e.target.files[0]
        try{ //try uploading the file
            const added = await client.add(
                file,
                {
                    progress: (prog) => console.log(`received: ${prog}`)
                }
            )
            //file saved in the url path below
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            setFileUrl(url)
        }catch(e){
            console.log('Error uploading file: ', e)
        }
    }

    //1. create item (image/video) and upload to ipfs
    async function createItem(){
        const {name, description, price, barricaTime, harvestYear, typeWine} = formInput; //get the value from the form input
        
        //form validation
        if(!name || !typeWine || !price || !fileUrl) {
            return
        }

        const data = JSON.stringify({
            name, description, barricaTime, harvestYear, typeWine, image: fileUrl
        });

        try{
            const added = await client.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            //pass the url to save it on Polygon after it has been uploaded to IPFS
            createSale(url)
        }catch(error){
            console.log(`Error uploading file: `, error)
        }
    }

    //2. List item for sale
    async function createSale(url){
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);

        //sign the transaction
        const signer = provider.getSigner();
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
        //let transaction = await contract.createToken(contract.createHash(nftaddress, tokenId, barricaTime, typeWine, harvestYear).toString());
        let transaction = await contract.createToken(url)
        let tx = await transaction.wait()

        //get the tokenId from the transaction that occured above
        //there events array that is returned, the first item from that event
        //is the event, third item is the token id.
        //console.log('Hash: ', contract.createHash(nftaddress, tokenId, barricaTime, typeWine, harvestYear).toString())
        console.log('Transaction: ',tx)
        console.log('Transaction events: ',tx.events[0])
        let event = tx.events[0]
        let value = event.args[2]
        let tokenId = value.toNumber() //we need to convert it a number

        //get a reference to the price entered in the form 
        const price = ethers.utils.parseUnits(formInput.price, 'ether')
        const barricaTime = formInput.barricaTime
        const harvestYear = formInput.harvestYear
        const typeWine = formInput.typeWine

        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);

        //get the listing price
        let listingPrice = await contract.getListingPrice()
        listingPrice = listingPrice.toString()

        transaction = await contract.createMarketItem(
            nftaddress, tokenId, barricaTime, harvestYear, typeWine, price, {value: listingPrice }
        )

        await transaction.wait()

        router.push('/')

    }

    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input 
                    placeholder="Product name"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({...formInput, name: e.target.value})}
                    />
                <input
                     placeholder="Type of wine"
                     className="mt-10 border rounded p-4"
                     onChange={e => updateFormInput({...formInput, typeWine: e.target.value})}
                />
                <input
                    placeholder="Description"
                    className="mt-4 border rounded p-6"
                    onChange={e => updateFormInput({...formInput, description: e.target.value})}
                    />
                <input 
                    placeholder="Year of the harvest"
                    className="mt-4 border rounded p-4"
                    type="number"
                    onChange={e => updateFormInput({...formInput, harvestYear: e.target.value})}
                    />
                
                <input 
                    placeholder="Amount of months in wine barrels"
                    className="mt-4 border rounded p-4"
                    type="number"
                    onChange={e => updateFormInput({...formInput, barricaTime: e.target.value})}
                    />
                <input 
                    placeholder="Price in Eth"
                    className="mt-4 border rounded p-4"
                    type="number"
                    onChange={e => updateFormInput({...formInput, price: e.target.value})}
                    />
                    <input
                        type="file"
                        name="Asset"
                        className="my-4"
                        onChange={onChange}
                    />
                    {
                        fileUrl && (
                           
                            <Image
                            src={fileUrl}
                            alt="Picture of the bottle wine"
                            className="rounded mt-4"
                            width={700}
                            height={800} 
                            // blurDataURL="data:..." automatically provided
                            // placeholder="blur" // Optional blur-up while loading
                          />
                        )
                    }
                    <button onClick={createItem}
                     className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
                     >Publish my bottle of wine</button>
            </div>
        </div>
    )
}