window.SUPABASE_URL = "https://ekiilctbzthmcvtjyool.supabase.co";
window.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bJD3HEz4RQu1xCcQU_85ZQ_XdyNBEt6";

window.getMarineCommunityClient = function () {
  return window.MarineCommunityClient ??= window.supabase.createClient(
    'https://zdgopdrehbphshdptjjr.supabase.co',
    'sb_publishable_C59a539RlAeLYmLCmGuVng_IFno8y8s',
    { auth: { storageKey: 'marine-community-auth' } }
  );
};
window.marineSignOut = async function (mainClient) {
  const community = window.getMarineCommunityClient();
  const current = await community.auth.getSession();
  if (current.error) return { error: current.error };
  if (current.data.session) {
    const result = await community.auth.signOut({ scope: 'local' });
    if (result.error) return result;
  }
  return mainClient.auth.signOut();
};
