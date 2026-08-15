const axios = require("axios");
const FormData = require("form-data");

const uploadToImgBB = async (file) => {

    const form = new FormData();

    form.append(
        "image",
        file.buffer,
        file.originalname
    );

    const { data } = await axios.post(

        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,

        form,

        {
            headers: form.getHeaders()
        }

    );

    return data.data.url;

};

module.exports = uploadToImgBB;