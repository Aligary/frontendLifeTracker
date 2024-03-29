import axios from "axios"

class ApiClient {
    constructor(remoteHostUrl) {
        this.remoteHostUrl = remoteHostUrl
        this.token = null
    }

    setToken(token) {
        this.token = token
    }

    async request ({endpoint, method = `GET`, data = {}}) {
        const url = `${this.remoteHostUrl}/${endpoint}`

        const headers = {
            "Content-Type": "application/json"
        }

        if(this.token) {
            headers["Authorization"] = `Bearer ${this.token}`
        }

        try {
            const res = await axios({url, method, data, headers})
            return {data: res.data, error: null}
        } catch(error) {
            console.error({errorRespone: error.response})
            const message = error?.respone?.data?.error?.message
            return {data: null, error: message || String(error)}
        }
    }

    async login(credentials) {
        return await this.request({endpoint: `auth/login`, method: `POST`, data: credentials})
    }

    async signup(credentials) {
        return await this.request({endpoint: `auth/register`, method: `POST`, data: credentials})
    }

    async createNutrition(nutrition) {
        console.log("in API", nutrition)
        return await this.request({endpoint: `nutritions`, method: `POST`, data: nutrition})
    }

    async listNutritionForUser() {
        return await this.request({endpoint: `nutritions`, method: `GET`})
    }

    async fetchNutritionById(id) {
        return await this.request({endpoint: `nutritions/:nutritionId`, method: `GET`, data: id})
    }



    
}

export default new ApiClient("http://localhost:3001")