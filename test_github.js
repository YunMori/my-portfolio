
async function testGithub() {
    try {
        const owner = 'facebook';
        const repo = 'react';
        console.log(`Fetching info for ${owner}/${repo}...`);

        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        console.log('Repo Status:', repoRes.status);
        console.log('Rate Limit Remaining:', repoRes.headers.get('x-ratelimit-remaining'));

        if (!repoRes.ok) {
            console.error('Repo Fetch Failed:', await repoRes.text());
            return;
        }

        const data = await repoRes.json();
        console.log('Repo Name:', data.name);
        console.log('Repo Description:', data.description);

        const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
        console.log('Readme Status:', readmeRes.status);

        if (readmeRes.ok) {
            const readmeData = await readmeRes.json();
            // Check if atob works
            try {
                const content = atob(readmeData.content);
                console.log('atob success, length:', content.length);
            } catch (e) {
                console.error('atob failed:', e);
            }
        }

    } catch (error) {
        console.error('Global Error:', error);
    }
}

testGithub();
