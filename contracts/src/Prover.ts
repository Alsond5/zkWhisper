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

export const Prover = ZkProgram({
    name: "message-prover",
    publicInput: Checker,
    publicOutput: Field,
    
    methods: {
        baseCase: {
            privateInputs: [],

            method(checker: Checker) {
                return checker.messageHistory;
            }
        },

        processMessage: {
            privateInputs: [SelfProof<Checker, Field>, MessageDetails],

            method(checker: Checker, earlierProof: SelfProof<Checker, Field>, md: MessageDetails) {
                earlierProof.verify();

                const verifyChecker = earlierProof.publicInput;
                Checker.requireEquals(checker, verifyChecker);

                const messageHistoryHash = earlierProof.publicOutput;

                // md.signature.verify(sender, md.publicKey.toFields().concat(md.cipherText));

                // add extra controls

                const calculatedNewHash = Poseidon.hash([messageHistoryHash, md.cipherText]);

                return calculatedNewHash;
            }
        }
    }
})