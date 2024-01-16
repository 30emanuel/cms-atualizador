import express from 'express';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const port = 3000;

app.post('/executar', async (req, res) => {
  try {
    await run();
    res.send('Execução concluída!');
  } catch (error) {
    console.error('Erro ao executar:', error);
    res.status(500).send('Erro ao executar.');
  }
});

async function fetchData() {
  const token = process.env.TOKEN_DATO;
  const datoUrl = 'https://graphql.datocms.com/';

  const query = `
  query {
    headerImg {
      logoPc
      logoMobile
      linkTerms
      poweredLink
    }
    initial {
      videoUrl
      textUp
      textMiddle
      videoBackground
      textLow
    }
    about {
      text
      titleSecondary
      title
      conspiracaoLink
    }
    allBrands {
      name
      logo
    }
    transitionOne {
      img
      logo
    }
    transitionTwo {
      img
      logo
    }
    allProjects {
      name
      typeProject
      stream
      width
      height
      gridPosition
      prevVideo
      imageMain
      text
      titleCreatedby
      createdby
      titleRealization
      realization
      titleSupport
      support
      titleDirection
      direction
      label5Title
      label5Description
      videourl
      videoThumb
      image1
      image2
      imageMiddle
      image3
      image4
    }
    brandlab {
      text
      textSecondary
      videoUrl
      videoBackground
    }
    contact {
      email
      youtubeLink
      instagramLink
      linkTerms
      poweredLink
    }
  }
`;

  try {
    const response = await fetch(datoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    console.log(data.data);

    const jsonData = JSON.stringify(data.data);

    console.log(jsonData);

    await fs.promises.mkdir('/tmp', { recursive: true }); // Cria o diretório /tmp se não existir
    await fs.promises.writeFile('/tmp/data.json', jsonData);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function uploadS3() {
  try {
    const s3 = new AWS.S3({
      accessKeyId: process.env.ACESSKEYID,
      secretAccessKey: process.env.SECRETACESSKEY,
      region: process.env.REGION,
    });

    const bucketName = process.env.BUCKETNAME;
    const fileName = 'data.json';

    const file = fs.createReadStream('/tmp/data.json');

    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: file,
      ACL: 'public-read',
    };

    await s3.upload(params).promise();

    console.log('Upload feito!');
    fs.unlink('/tmp/data.json', (unlinkErr) => {
      if (unlinkErr) {
        console.error('Erro ao excluir o arquivo:', unlinkErr);
      } else {
        console.log('Arquivo temporario excluído com sucesso.');
      }
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function run() {
  try {
    await fetchData();
    await uploadS3();
    console.log('Busca e Upload feitos.');
  } catch (error) {
    console.log('Run error', error);
    throw error;
  }
}

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});