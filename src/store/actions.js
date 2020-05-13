export default {
  setTotals: async function (context) {
    const response = await window.db.query('offpim/totals', {
      group: true
    })
    context.commit('setTotals', response)
  },
  addError(context) {
    context.commit('addError')
  },
  deleteDocument: async function (context, docId) {
    let result;
    try {
      var doc = await window.db.get(docId);
      var response = await window.db.remove(doc);
      this.commit('addDeleted', docId)
      this.commit('showSnackbar', { text: 'Document deleted', color: 'error' })
      console.log('Doc delete result: ', response); // TODO - send to log
    } catch (error) {
      context.commit('addAlert', { type: 'error', text: 'Deleting document failed: ' + error })
      result = error
    }
    return await result;
  },

  insertDocument: async function (state, payload) {
    let txt;
    let pDoc = payload.doc;

    try {
      if (!pDoc._id) { // Consider handing off _id(uuid)generation to PouchDB
        const errtxt = "_id missing in request. Insert unsuccessful";
        throw errtxt
      }

      if (pDoc._rev) {
        var eDoc = await window.db.get(pDoc._id);
        pDoc._rev = eDoc._rev
      }

      var response = await window.db.put(pDoc);
      if (response.ok) {
        if (payload.snackbarText) {
          txt = payload.snackbarText
        } else {
          txt = 'Document update OK'
        }
        this.commit('showSnackbar', { text: txt, color: 'success' })
      } else {
        const errtxt = 'Document update failed' + response;
        throw errtxt
      }
      return await response;
    } catch (error) {
      this.commit('addAlert', { type: 'error', text: error })
    }
  },

  postData: async function (state, payload) {
    this.commit('loaderActive')
    const response = await fetch(payload.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload.data)
    });
    let data = await response.json();
    this.commit('loaderInactive')
    return data;
  },

  startupIndexCheck: async function (context, payload) {    
    try {
      const localVersion = payload.version;
      const dbDoc = await window.db.get(`_design/${payload.doc}`); // databaseDesignDoc
      if (localVersion > dbDoc.version) {
        console.log('Design document version in app is higher than the one in the database. Attempting design doc insert');
        return false
      }
      return true
    } catch (error) {
      console.log('Design doc ' + payload.doc + ' not in local database: ', error)
      return false
    }
  },

  remoteDBConnectivityCheck: async function (context) {
    try {
      const response = await window.remoteDB.info();
      if (response.db_name) {
        context.commit('setGenericStateBooleanTrue', 'remoteDBIsOnline');
        this.commit('showSnackbar', { text: 'Remote database connection successful', color: 'success' });
        context.dispatch('remoteDBInfo');
        return true
      }
    } catch (error) {
      // TODO Send to log (requires logging feature)
      // TODO Advise troubleshooting steps (network/curl, CORS )
      this.commit('showSnackbar', { text: 'Remote database connection unsuccessful', color: 'error', log: error });
      context.commit('setGenericStateBooleanFalse', 'remoteDBIsOnline');
      return false
    }
  },

  remoteDBInfo: async function (context) {
    const result = await window.remoteDB.info();
    context.commit('remoteDBInfo', result)
  },

  localDBInfo: async function (context) {
    const result = await window.db.info();
    context.commit('localDBInfo', result)
  },

  setRawDocumentViewerDocument: async function (context, docId) {
    try {      
      context.commit(
        'setRawDocumentViewerDocument', 
        await window.db.get(docId)
        )
    } catch (error) {
      this.commit('showSnackbar', { text: 'Could not find document', color: 'warning', log: error });
      // TODO - send to debug
      console.log(error)
    }
  }

}