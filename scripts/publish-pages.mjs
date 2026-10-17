import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

// Publish a static build to gh-pages without changing the source checkout.
// Existing branch history is retained; concurrent updates fail safely.
const root = resolve(import.meta.dirname, '..');
const siteUrl = process.env.SITE_URL || 'https://gkkm8bm7rn-eng.github.io/Otutto';
const branch = 'gh-pages';
const gitAuth = process.env.GH_TOKEN ? ['-c', 'credential.helper=!gh auth git-credential'] : [];
function run(command, args, cwd=root, options={}) {
  const result = spawnSync(command, args, { cwd, encoding:'utf8', env:process.env, ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${command} failed`);
  return (result.stdout || '').trim();
}
const git = (args,cwd=root) => run('git',[...gitAuth,...args],cwd);
run(process.execPath,['scripts/build.mjs'],root,{env:{...process.env,SITE_URL:siteUrl,SITE_NOINDEX:'false'},stdio:'inherit'});
run(process.execPath,['scripts/check.mjs'],root,{stdio:'inherit'});
const remote = git(['remote','get-url','origin']);
const branchExists = git(['ls-remote','--heads',remote,branch]).length > 0;
const temp = await mkdtemp(resolve(tmpdir(),'otutto-pages-'));
const checkout = resolve(temp,'site');
try {
  if (branchExists) {
    git(['clone','--single-branch','--branch',branch,'--depth','1',remote,checkout]);
  } else {
    await mkdir(checkout);
    git(['init','-b',branch],checkout);
    git(['remote','add','origin',remote],checkout);
  }
  for (const entry of await readdir(checkout)) {
    if (entry !== '.git') await rm(resolve(checkout,entry),{recursive:true,force:true});
  }
  await cp(resolve(root,'dist'),checkout,{recursive:true});
  git(['add','--all'],checkout);
  if (!git(['status','--porcelain'],checkout)) {
    console.log('GitHub Pages branch already matches this build.');
  } else {
    git(['commit','-m','Publish OTUTTO static website'],checkout);
    git(['push','origin',`HEAD:refs/heads/${branch}`],checkout);
    console.log(`Published static files to ${branch}. GitHub Pages deploys this branch when it is selected in repository settings.`);
  }
} finally {
  await rm(temp,{recursive:true,force:true});
}
