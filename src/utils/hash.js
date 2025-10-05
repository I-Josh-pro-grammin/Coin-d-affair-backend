import bcrypt from 'bcrypt'
const hashPassword = async (password)=> {
    const hashedPassword = await bcrypt.hash(password,10);
    return hashedPassword;
}


const comparePassword = async(password,hashedPassword)=>{
    const comparePasswordResult = await bcrypt.compare(password,hashedPassword)
    return comparePasswordResult;
}

export {
    hashPassword,
    comparePassword
}