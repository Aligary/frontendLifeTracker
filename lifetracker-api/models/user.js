const bcrypt = require("bcrypt")
const db = require("../db")
const { BCRYPT_WORK_FACTOR } = require("../config")
const { BadRequestError, UnauthorizedError } = require("../utils/errors")

class User {
    static async makePublicUser(user) {
        return {
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email
        }
    }

    static async login(credentials) {
        //user should submit email and password
        //if any field missing throw an error
        const requiredFields = ["password", "email"]
        requiredFields.forEach((e) => {
            if(!credentials.hasOwnProperty(e)) {
                throw new BadRequestError(`Missing ${e} in request body.`)
            }
        })

        //lookup user in db by email
        const user = await User.fetchByEmail(credentials.email)
        //if user found, compare submitted pw with pw in db
        //if match, return user
        if (user) {
            const isValid = await bcrypt.compare(credentials.password, user.password)
            if (isValid) {
                return User.makePublicUser(user)
            }
        }
        //if any goes wrong throw an error
        throw new UnauthorizedError("Invalid email/password")
    }

    static async register(credentials) {
        //user should submit email, pw
        //if any missing, throw an error
        const requiredFields = ["password", "email", "username", "first_name", "last_name"]
        requiredFields.forEach((e) => {
            if(!credentials.hasOwnProperty(e)) {
                throw new BadRequestError(`Missing ${e} in request body.`)
            }
        })

        if(credentials.email.indexOf("@") <= 0) {
            throw new BadRequestError("Invalid email.")
        }
        //make sure no user already exists in db with same email
        //if one does throw an error
        const existingEmail = await User.fetchByEmail(credentials.email)
        if(existingEmail) {
            throw new BadRequestError(`This email already exists: ${credentials.email}`)
        }

        


        //take users pw and hash it
        const hashedPassword = await bcrypt.hash(credentials.password, BCRYPT_WORK_FACTOR)
        //take email and lowercase it
        const lowercasedEmail = credentials.email.toLowerCase()

        //create new user in db with all info
        const result = await db.query(`
            INSERT INTO users (
                password,
                email,
                username,
                first_name,
                last_name
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, password, email, username, first_name, last_name;
        `, [hashedPassword, lowercasedEmail, credentials.first_name, credentials.last_name, credentials.passwordConfirm])
        
        //return user
        const user = result.rows[0]

        return User.makePublicUser(user)
    }

    static async fetchByEmail(email) {
        if (!email) {
            throw new BadRequestError("No email provided")
        }

        const query = `SELECT * FROM users WHERE email = $1`

        const result = await db.query(query, [email.toLowerCase()])

        const user = result.rows[0]

        return user
    }
}
module.exports = User