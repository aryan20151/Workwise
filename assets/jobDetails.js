const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getJobDetails() {
  rl.question('Enter Job Title: ', (jobTitle) => {
    rl.question('Enter Company Name: ', (companyName) => {
      rl.question('Enter Job Location: ', async (location) => {
        const newJob = { jobTitle, companyName, location };

        try {
          const stats = await fs.promises.stat('jobs.json');
          const data = await fs.promises.readFile('jobs.json', 'utf8');
          const jobs = JSON.parse(data);
          jobs.push(newJob);
          await fs.promises.writeFile('jobs.json', JSON.stringify(jobs, null, 2));
          console.log('Job successfully added!');
          console.log('Current jobs.json content:');
          console.log(JSON.stringify(jobs, null, 2));

          
        } catch (err) {
          if (err.code === 'ENOENT') {
            await fs.promises.writeFile('jobs.json', JSON.stringify([newJob], null, 2));
            console.log('Job successfully added!');
            console.log('Current jobs.json content:');
            console.log(JSON.stringify([newJob], null, 2));
          } else {
            console.error('Error:', err);
          }
        } finally {
          rl.close();
        }
      });
    });
  });
}

getJobDetails();
