import { Field, Group, MerkleMapWitness, Poseidon, PrivateKey, PublicKey, SelfProof, Signature, Struct, ZkProgram } from "o1js";

export class Checker extends Struct ({
    messageHistory: Field,
    participants: Field
}) {
    constructor(messageHistory: Field, participants: Field) {
        super({ messageHistory, participants });

        this.messageHistory = messageHistory;
        this.participants = participants;
    }

    static requireEquals(checker: Checker, other: Checker) {
        checker.messageHistory.assertEquals(other.messageHistory);
        checker.participants.assertEquals(other.participants);
    }
}

export class MessageDetails extends Struct ({
    cipherText: Field,
    publicKey: Group,
    signature: Signature,
}) {
    constructor(cipherText: Field, publicKey: Group, signature: Signature) {
        super({ cipherText, publicKey, signature });

        this.cipherText = cipherText;
        this.publicKey = publicKey;
        this.signature = signature;
    }
}

export class Outputs extends Struct({
    hashedMessage: Field,
    newMessageHistory: Field
}) {
    constructor(hashedMessage: Field, newMessageHistory: Field) {
        super({ hashedMessage, newMessageHistory });

        this.hashedMessage = hashedMessage;
        this.newMessageHistory = newMessageHistory;
    }
}

export const Prover = ZkProgram({
    name: "message-prover",
    publicInput: Checker,
    publicOutput: Outputs,
    
    methods: {
        baseCase: {
            privateInputs: [],

            method(checker: Checker) {
                return new Outputs(Field(0), checker.messageHistory);
            }
        },

        processMessage: {
            privateInputs: [SelfProof<Checker, Outputs>, MessageDetails, PublicKey, MerkleMapWitness],

            method(checker: Checker, earlierProof: SelfProof<Checker, Outputs>, md: MessageDetails, sender: PublicKey, witness: MerkleMapWitness) {
                earlierProof.verify();

                const verifyChecker = earlierProof.publicInput;
                Checker.requireEquals(checker, verifyChecker);

                md.signature.verify(sender, md.publicKey.toFields().concat(md.cipherText));
                
                const [root, key] = witness.computeRootAndKey(Field(2n));
                const hashedSender = Poseidon.hash(sender.toFields());
                
                key.assertEquals(hashedSender);
                checker.participants.assertEquals(root);

                const messageHistoryHash = earlierProof.publicOutput.newMessageHistory;
                const calculatedNewHash = Poseidon.hash([messageHistoryHash, md.cipherText]);

                return new Outputs(md.cipherText, calculatedNewHash);
            }
        }
    }
})