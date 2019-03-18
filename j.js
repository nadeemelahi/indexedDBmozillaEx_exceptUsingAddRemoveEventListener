"use strict";
var DOM = new function(){

   var i,tmp,
       $title = document.getElementById("title"),
       $body = document.getElementById("body"),
       $allNotes = document.getElementById("allNotes"),
       $createNewNote = document.getElementById("createNewNote"),

       prevTitleVal = null, prevBodyVal = null;

   this.addEntry = function(){
      $createNewNote.disabled = true; 

      if($title.value === "" || $body.value === ""){
	 console.log("you didn't enter a title or value");
	 this.reEnableAddEntryBtn();

      } else if ($title.value === prevTitleVal){
	 console.log("you just entered that same title");
	 this.reEnableAddEntryBtn();

      } else if ($body.value === prevBodyVal){
	 console.log("you just entered that same body text");
	 this.reEnableAddEntryBtn();

      } else {
	 console.log("DOM.addEntry()");
	 ix.store.add($title.value,$body.value);
      }

   }; 
   
   this.reEnableAddEntryBtn = function(){
      $title.value = "";
      $body.value = "";
      $createNewNote.disabled = false; 

   };

   this.emptyAllList = function(){
      console.log("DOM.emptyAllList");

      while($allNotes.firstChild)
	 $allNotes.removeChild($allNotes.firstChild);

   };

   var li,btn,h3,p;

   this.insert = function(id,title,body){
      li = document.createElement("li");
      btn = document.createElement("button");
      h3 = document.createElement("h3");
      p = document.createElement("p");
      
      btn.textContent = "x";
      btn.setAttribute("data-note-id",id);
      btn.style.float = "right";
      h3.textContent = id + ". " + title;
      p.textContent = body;

      li.appendChild(btn);
      li.appendChild(h3);
      li.appendChild(p);

      li.style.borderBottom = "1px solid gray";

      $allNotes.appendChild(li);

   };

   this.insertEmptyMsg = function(){
      li = document.createElement("li");
      p = document.createElement("p");
      p.textContent = "store is empty -no records";
      li.appendChild(p);
      $allNotes.appendChild(li);
   };


};

var ix = {

   h: {
      db_open_req: {
	 upgradeneededH: function(e){
	    console.log("ix.h.db_open_req upgradeneededH");
	    ix.db.db = this.result;
	    ix.store.schema(ix.db.db, ix.db.storeName);

	    this.removeEventListener("upgradeneeded",
	       ix.h.db_open_req.upgradeneededH,false);
	 },
	 successH: function(e){
	    console.log("ix.h.db_open_req successH");
	    ix.db.db = this.result;
	    ix.db.beneficiaries();
	    ix.store.loadAllBatchReq();

	    DOM.reEnableAddEntryBtn();

	    this.removeEventListener("success",
	       ix.h.db_open_req.successH,false);
	 },
	 errorH: function(e){
	    console.log("ix.h.db_open_req errorH");

	    this.removeEventListener("error",
	       ix.h.db_open_req.errorH,false);
	 }
      },

      store_add_tr: {
	 rw_trCompleteH: function(e){
	    console.log("rw_trCompleteH");
	    DOM.reEnableAddEntryBtn();

	    this.removeEventListener("complete",
	       ix.h.store_add_tr.rw_trCompleteH,false);
	 },
	 rw_trErrorH: function(e){
	    console.log("rw_trErrorH");
	    
	    this.removeEventListener("error",
	       ix.h.store_add_tr.rw_trErrorH,false);
	 }
      },

      store_add_req: {
	 successH: function(e){
	    console.log("storeAddSuccessH");

	    ix.store.addResp();

	    this.removeEventListener("success",
	       ix.h.store_add_req.successH,false);
	 }
      },

      store_countReq_req: {
	 successH: function(e){
	    console.log("ix.h.store_countReq_req.successH");

	    ix.store.countResp(this.result);

	    this.removeEventListener("success",
	       ix.h.store_countReq_req.successH,false);
	 }
      },

      store_allKeysReq_req: {
	 successH: function(e){

	    ix.store.allKeysResp(this.result);

	    this.removeEventListener("success",
	       ix.h.store_allKeysReq_req.successH,false);
	 }
      },

      store_cursorReq_req: {
	 successH: function(e){
	    console.log("ix.h.store_cursorReq_req.successH");

	    ix.store.cursorResp(this.result);

	    this.removeEventListener("success",
	       ix.h.store_cursorReq_req.successH,false);
	 }
      },

      store_rmById_tr: {
	 completeH: function(e){
	    console.log("ix.h.store_rmById_tr.completeH");

	    this.removeEventListener("complete",
	       ix.h.store_rmById_tr.completeH,false);
	 }
      },

      store_rmById_req: {
	 successH: function(e){
	    console.log("ix.h.store_rmById_req.successH");

	    ix.store.rmByIdResp();

	    this.addEventListener("success",
	       ix.h.store_rmById_req.successH,false);
	 }
      },

      store_loadAllBatchReq_req: {
	 successH:function(e){
	    ix.store.loadAllBatchResp(this);
	 }
      }

   },

   db: {
      db: null,
      storeName: "store01",

      open: function(){
	 var dbName = "notes01",
	    dbVersion = "1";

	 var dbReq = window.indexedDB
	    .open(dbName,dbVersion);

	 dbReq.addEventListener("error",
	    ix.h.db_open_req.errorH,false);

	 dbReq.addEventListener("success",
	    ix.h.db_open_req.successH,false);

	 dbReq.addEventListener("upgradeneeded",
	    ix.h.db_open_req.upgradeneededH,false);

      },

      beneficiaries: function(){ //beneficiary ie.inheritance
	 ix.store.db = this.db;
	 ix.store.storeName = this.storeName;

      }
   },

   store: {
      db: null, //inherited
      storeName: null, //inherited

      schema: function(db, storeName){
	 var storeReq = db.createObjectStore(
	    storeName,
	    {keyPath: "id", autoIncrement: true});

	 storeReq.createIndex(
	    "title","title",{unique:false});

	 storeReq.createIndex(
	    "body","body",{unique:false});
      },

      add: function(title,body){
	 var tr,store,req;

	 tr = this.db.transaction(
	    [this.storeName],'readwrite');

	 tr.addEventListener("complete",
	    ix.h.store_add_tr.rw_trCompleteH,false);

	 tr.addEventListener("error",
	    ix.h.store_add_tr.rw_trErrorH,false);

	 store = tr.objectStore(this.storeName);

	 req = store.add({title:title,body:body});

	 req.addEventListener("success",
	    ix.h.store_add_req.successH,false);

      },
      
      addResp: function(){
	 console.log("ix.store.addResp()");
	 this.reloadList();
      }, 

      loadAll: function(){
	 this.countReq();
      },

      countReq: function(){

	 var store = this.db
	    .transaction(this.storeName)
	    .objectStore(this.storeName);

	 var req = store.count();

	 req.addEventListener("success",
	    ix.h.store_countReq_req.successH,false);
      },

      counter: null, count: null,

      countResp: function(count){
	 console.log("count: " + count);
	 DOM.emptyAllList();

	 if(count>0){

	    this.counter = 1;
	    this.count = count;
	    this.allKeysReq();
	    
	 } else {
	    console.log("store is empty");
	    DOM.insertEmptyMsg();
	 }

      },

      allKeysReq: function(){

	 var store = this.db
	    .transaction(this.storeName)
	    .objectStore(this.storeName);

	 var index = store.index("title");
	 var req = index.getAllKeys();

	 req.addEventListener("success",
	    ix.h.store_allKeysReq_req.successH,false);
      },

      allKeysResp: function(allkeys){
	 //console.log(allkeys);
	 var i = 0, l = allkeys.length;
	 for(i;i<l;i++){
	    //console.log(allkeys[i]);
	    this.cursorReq(allkeys[i]);
	 }

      },

      cursorReq: function(i){
	 var store = this.db
	    .transaction(this.storeName)
	    .objectStore(this.storeName);

	 var req = store.openCursor(i);

	 req.addEventListener("success",
	    ix.h.store_cursorReq_req.successH,false);

      },

      cursorResp: function(cursor){

	 DOM.insert(cursor.value.id,
	    cursor.value.title,
	    cursor.value.body);

      },

      rmById: function(id){

	 var id = Number(id);
	 var tr = this.db.transaction(
	    [this.storeName],"readwrite");

	 tr.addEventListener("complete",
	    ix.h.store_rmById_tr.completeH,false);

	 var store = tr.objectStore(this.storeName);
	 var req = store.delete(id);

	 req.addEventListener("success",
	    ix.h.store_rmById_req.successH,false);
      },

      rmByIdResp: function(){
	 console.log("ix.store.rmByIdResp()");
	 this.reloadList();
      },

      loadAllBatchReq: function(){
	 var store = this.db
	    .transaction(this.storeName)
	    .objectStore(this.storeName);

	 var req = store.openCursor();
	 req.addEventListener("success",
	    ix.h.store_loadAllBatchReq_req.successH,false);
      },

      loadAllBatchResp: function(cursorReq){
	 var cursor = cursorReq.result;

	 if(cursor){

	    console.log(cursor.value.id,
	       cursor.value.title,
	       cursor.value.body);
	    this.cursorResp(cursor);
	    cursor.continue();

	 } else {
	    cursorReq.removeEventListener("success",
	       ix.h.store_loadAllBatchReq_req.successH,false);
	 }
	 	 
      },

      reloadList: function(){
	 console.log("ix.store.reloadList()");
	 DOM.emptyAllList();
	 //this.loadAll();
	 this.loadAllBatchReq();

      }

   }

};


window.addEventListener("load",app,false);
function app(){

   document.body.addEventListener("click",clickH,false); 

   if (!('indexedDB' in window)){
      console.log("indexedDB not supported");
      return;

   } else {
      ix.db.open();

   }


}

function clickH(e){
   if(!e) var e = window.event;

   if(e.target.id === "createNewNote") {
      console.log("createNewNote button click");
      DOM.addEntry();

   } else if (e.target.id === "loadAll"){
      DOM.emptyAllList();
      ix.store.loadAllBatchReq();

   } else if (e.target.textContent === "x"){
      //console.log(e.target.getAttribute("data-note-id"));
      ix.store.rmById(e.target.getAttribute("data-note-id"));
   }
}
