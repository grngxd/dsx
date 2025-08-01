import m from "msgpack-lite";
export const b64encode = (obj: object): string => {
    return Buffer.from(m.encode(obj)).toString("base64url");
}

export const b64decode = <T>(str: string): T => {
    try {
        return m.decode(Buffer.from(str, "base64url"));
    } catch {
        throw new Error("invalid base64-encoded object string: " + str);
    }
}