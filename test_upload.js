const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testUpload() {
  const form = new FormData();
  fs.writeFileSync('test.jpg', 'fake image content');
  form.append('file', fs.createReadStream('test.jpg'));

  try {
    const res = await axios.post('http://127.0.0.1:5000/api/attachment/uploads', form, {
      headers: form.getHeaders(),
    });
    console.log(res.data);
  } catch (error) {
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testUpload();
