/*import {
	createDocWithMd,
	render,
	insertBlock,
	sql,
	appendBlock,
	getHPathByID,
	checkUpdate,
	version,
	httpRequest,
	httpGet, getFileContent,
} from './api.js';*/

import * as api from './api.js';
import * as util from './util.js';
import {
	getBlockByID,
	getHPathByID,
	setBlockAttrs,
	getBlockAttrs,
	getFileContent,
	putFile,
	duplicateDoc, refreshFiletree, listDocsByPath, getFullHPathByID
} from './api.js';
// import {config} from "./config";
const fs = window.parent.require('fs');


let last_merge_result_doc_id


//检查 按钮
 $("#check_doc_info_btn").click(function () {
	 checkDocInfoBeforeMerge().then(r => {})
 })

//合并
 $("#begin_merge_btn").click(function () {
	 merge().then(r => {})
 })

//删除按钮
$("#delete_last_merged_doc_btn").click(() => {
	delete_last_merged_doc()
})

/* utils
使用api(非sql)获取block的各种信息,包括下面几种
获取当前文档的目录, 假如path为/a/b/c/d 则目录为/a/b/c/ ; 假如path为 /a 目录为 /
块的属性: 标题(title) 类型(type,比如doc),自定义属性(custom-)
*/
async function getBlockInfo(blockIdArg) {
	let blockId;
	let doc1_sy_path;
	let curBlock1
	let doc1_parent_path;
	// 获取当前文档的目录, 假如path为/a/b/c/d 则目录为/a/b/c/ ; 假如path为 /a 目录为 /
	// blockId="20220816091715-law0025"
	// blockId="20220813085628-f9j9mkb"  //三级文档
	// blockId="20220815052252-bzspew1" //一级文档
	blockId=blockIdArg
	console.log("getBlockInfo-blockId:"+blockId)
	let curBlock1Hpath=await getHPathByID(blockId)
	curBlock1= await api.getBlockInfo(blockId);
	if(!curBlock1){
		console.error("挂件错误:getBlockInfo无法获取块信息:"+blockId)
	}
	console.log("getBlockInfo-ret:"+JSON.stringify(curBlock1))

	console.log("path:"+curBlock1.path)
	console.log("box:"+curBlock1.box)
	console.log("hpath:"+curBlock1.hpath)
	console.log("hpath(other api):"+curBlock1Hpath)
	// doc1_sy_path = "/data/" + curBlock1.box  + curBlock1.path
	let doc1_path=curBlock1.path;
	doc1_parent_path=doc1_path.substring(0,doc1_path.lastIndexOf("/")+1)
	console.log("doc1_parent_path:"+doc1_parent_path)

	//获取块属性 (含有title)
	let blockAttrs= await api.getBlockAttrs(blockId);

	let ret = {
		dir_path:doc1_parent_path,
		path:curBlock1.path,
		hpath:curBlock1Hpath,// 通过单独api获取
		box:curBlock1.box,
		id:blockId,
		blockAttrs: blockAttrs,
		title: blockAttrs.title, //或者 curBlock1.rootTitle
	};
	return ret
}

//克隆文档,并返回新文档的id和path
async function cloneDoc(docIdArg) {
	let dbg=1

	let msg_bar = document.getElementById('process_msg');
	let docId
	docId="20201222095049-hghafhe"
	docId="20200922102318-oz84yu3"
	docId= docIdArg
	let siblingInfoBeforeClone = await getSiblingDocsInfo(docId);

	console.log("等待处理2")
	// msg_bar.innerHTML="开始复制文档1....."
	console.log("开始复制文档1.....")
	let doc1_dup_ret = await api.duplicateDoc(docId);
	// msg_bar.innerHTML="文档1复制完成....."
	console.log("文档1复制完成")
	console.log("doc1_dup_ret:"+doc1_dup_ret)
	console.log("doc1_dup_ret-str:"+JSON.stringify(doc1_dup_ret))
	let siblingInfoAfterClone = await getSiblingDocsInfo(docId);
	//after减before得到克隆文档的id; (api没有返回😂)
	let newDocIndex=-1
	let newDocId
	let newDocPath
	let isSucces=false
	for (let i = 0; i < siblingInfoAfterClone.siblingDocIds.length; i++) {
		if(!siblingInfoBeforeClone.siblingDocIds.includes(siblingInfoAfterClone.siblingDocIds[i])){
			// console.log("发现新文档:"+i)
			dbg && console.log("发现新文档:"+i+"|"+siblingInfoAfterClone.siblingDocNames[i])
			newDocIndex=i
			newDocId=siblingInfoAfterClone.siblingDocIds[i]
			newDocPath=siblingInfoAfterClone.siblingDocPaths[i]
			if (!isSucces) {
				isSucces=true
			}else {
				isSucces=false
				break
			}
		}
	}
	let ret={
		newDocId: newDocId,
		newDocPath: newDocPath,
		blockInfo: siblingInfoBeforeClone.blockInfo,
	}
	if (!isSucces) {
		ret={}
	}
	return ret;
}


async function checkDocInfoBeforeMerge() {
	console.clear()
	console.log("--------------------------------"+new Date().toLocaleString())
	document.getElementById("doc1_info").innerHTML=""
	document.getElementById("doc2_info").innerHTML=""
	console.log("你顶级但是dfs:"+$("#doc1_id_input").value)
	 // console.log("第三方:"+document.getElementById('doc1_id_input').innerHTML)
	 console.log("第三方2:"+document.getElementById('doc1_id_input').value+";")
	 let doc1id = document.getElementById('doc1_id_input').value;
	 let doc2id = document.getElementById('doc2_id_input').value;
	 if(doc1id.trim()) {
		 try {
			let doc1info = await  getBlockInfo(doc1id.trim());
			 console.log("doc1info2-fdgd:"+doc1info)
			 console.log("doc1info2-str:"+JSON.stringify(doc1info))
			 console.log("doc1info.hpath:"+doc1info.hpath)
			 // document.getElementById("doc1_info").innerHTML=doc1info.hpath
			 document.getElementById("doc1_info").innerHTML=doc1info.hpath
			 let doc1fullHpath = await api.getFullHPathByID(doc1id.trim());
			 console.log("doc1fullHpath:"+doc1fullHpath)
			 document.getElementById("doc1_info").innerHTML=doc1fullHpath
		 } catch (e){
			 document.getElementById("doc1_info").innerHTML = e.message
			 // console.error(e.stack)
			 console.error(e.name+":"+e.stack)
		 }
	 }else {
		 console.log("空doc1id")
		 document.getElementById("doc1_info").innerHTML = "文档1 ID为空"
	 }
	 console.log("-------check doc2 id")
	 if (doc2id.trim()) {
		 // let doc2info = await getBlockInfo(doc2id.trim());
		// return
		 try {
			 let doc2info = await getBlockInfo(doc2id.trim());
			 document.getElementById("doc2_info").innerHTML = doc2info.hpath
			 let doc2fullHpath = await api.getFullHPathByID(doc2id.trim());
			 console.log("doc2fullHpath:"+doc2fullHpath)
			 document.getElementById("doc2_info").innerHTML=doc2fullHpath
		 } catch (e){
			 document.getElementById("doc2_info").innerHTML = e.message
			 console.error(e.stack)
		 }

	 }else {
		 document.getElementById("doc2_info").innerHTML = "文档2 ID为空"
		 console.log("空doc2id")
	 }
}


async function merge() {
	console.clear()
	console.log("--------------------------------"+new Date().toLocaleString())
	let msg_bar = document.getElementById('process_msg');
	document.getElementById("merged_doc_hpath").innerHTML=""

	if (1) {
		let doc1id;
		let doc2id;
		doc1id = "20200910201551-h4twhas"; //书签
		doc2id = "20200915214115-42b8zma"; //资源文件

		doc2id = "20201222095049-hghafhe"; //类型过滤
		// doc2id = "20200825162036-4dx365o"; //排版元素1
		doc2id = "20220415190432-r3xqn3r"; //查询语法
		doc1id = "20220708095345-tu7nz95"; //数据备份
		if (1) {
			doc1id=document.getElementById("doc1_id_input").value.trim()
			doc2id=document.getElementById("doc2_id_input").value.trim()
		}
		console.log("doc1id:"+doc1id)
		console.log("doc2id:"+doc2id)
		// return
		//克隆返回新文档id
		msg_bar.innerHTML="开始克隆文档1......"
		let doc1newDocInfo = await cloneDoc(doc1id);
		msg_bar.innerHTML="克隆文档1 done"

		// return
		console.log("doc1newDocInfo.newDocId:"+doc1newDocInfo.newDocId)
		let doc1cloneDoc = await getBlockInfo(doc1newDocInfo.newDocId);
		console.log("doc1newDocInfo.newBlockinfo1:"+doc1cloneDoc.path)
		console.log("doc1newDocInfo.newBlockinfo2:"+doc1cloneDoc.box)
		console.log("doc1newDocInfo.newBlockinfo3:"+doc1cloneDoc.hpath)
		console.log("doc1newDocInfo.newBlockinfo4name:"+doc1cloneDoc.name)
		let doc1cloneDocAttrs = await api.getBlockAttrs(doc1newDocInfo.newDocId);
		console.log("doc1cloneDocAttr:"+JSON.stringify(doc1cloneDocAttrs))
		// return
			// 克隆文档2
			msg_bar.innerHTML="开始克隆文档2......"
			let doc2newDocInfo = await cloneDoc(doc2id);
			msg_bar.innerHTML="克隆文档2 done"

			console.log("doc1newDocInfo.newDocId:"+doc2newDocInfo.newDocId)
			let doc2cloneDoc = await getBlockInfo(doc2newDocInfo.newDocId);
		if (1) {
		let doc1_sy_content= await getFileContent("/data/"+doc1cloneDoc.box+doc1cloneDoc.path)
        let doc2_sy_content= await getFileContent("/data/"+doc2cloneDoc.box+doc2cloneDoc.path)
        let concat = doc1_sy_content.Children.concat(doc2_sy_content.Children);
        console.log("concat:"+JSON.stringify(concat))
			// console.log("结束2")
			// return

			if(1){

				if (1) {
					msg_bar.innerHTML="准备删除文档副本.."
					await delayMs(2000, "开始删除")
					//	写之前移除 文档1副本
					let rmDoc1Ret = await api.removeDoc(doc1cloneDoc.box,doc1cloneDoc.path);
					console.log("移除rmDoc1Ret:"+rmDoc1Ret)
					if (1) {
					//	移除文档2副本
						let rmDoc2Ret = await api.removeDoc(doc2cloneDoc.box,doc2cloneDoc.path);
						console.log("移除rmDoc2Ret:"+rmDoc2Ret)
					}
				}
				// console.log("结束3")
				// return
				// let path = "/data/20220717131443-gdf3hhd/20220731202400-4css9vf/10220816170137-iyir1zq.sy";
				// let path = "/data/20210808180117-czj9bvb/20200812220555-lj3enxa/20210808180320-qgr0b3q/10220816170137-iyir1zq.sy";
				// let path = "/data/20210808180117-czj9bvb/20200812220555-lj3enxa/20210808180320-qgr0b3q/"+doc1cloneDoc.id+".sy"; //使用副本的id
				//使用原来副本的路径
				let path = "/data/"+doc1cloneDoc.box+doc1cloneDoc.path;
				console.log("合并文档路径:"+path)
				// let file = "C:\\Users\\pcmsi\\Documents\\SiYuan\\data\\20220717131443-gdf3hhd\\20220731202400-4css9vf\\mysyfile2.txt1";

				// let putfile_ret=await api.putFile(path,false,null,file)
				// let putfile_ret=await putFile2(path,"我大丰收嘎34567");
				// let putfile_ret=await putFile2(path,JSON.stringify(concat));
				doc1_sy_content.Children=concat
				// doc1_sy_content.ID="10220816170137-iyir1zq"
				let putfile_ret=await putFile2(path,JSON.stringify(doc1_sy_content));

				console.log("写完成:"+putfile_ret);
				console.log("写完成str:"+JSON.stringify(putfile_ret));
				let doc1info=await getBlockInfo(doc1id)
				let doc2info=await getBlockInfo(doc2id)
				if (1) {
				//	重命名新合并的文档
				// 	doc1cloneDoc.id
				// 	let doc1attr = await api.getBlockAttrs(doc1id);
				// 	let doc2attr = await api.getBlockAttrs(doc2id);

					// await api.renameDoc(doc1cloneDoc.box,doc1cloneDoc.path,"合并后 "+doc1cloneDocAttrs.title)
					// await api.renameDoc(doc1cloneDoc.box,doc1cloneDoc.path,"合并("+doc1attr.title+")("+doc2attr.title+")")
					// await api.renameDoc(doc1cloneDoc.box,doc1cloneDoc.path,"合并3("+doc1info.title+")("+doc2info.title+")")
					// await api.renameDoc(doc1cloneDoc.box,doc1cloneDoc.path,"合并3("+doc1info.title+")("+doc2info.title+")"+new Date().toLocaleString())
					// 标题不能带斜杠
					// await api.renameDoc(doc1cloneDoc.box,doc1cloneDoc.path,"合并3("+doc1info.title+")("+doc2info.title+")"+util.curtime())
					await api.renameDoc(doc1cloneDoc.box,doc1cloneDoc.path,"合并 "+util.curtime()) //for dbg
				}
				let doc1notebookConf = await api.getNotebookConf(doc1info.box);
				let doc2notebookConf = await api.getNotebookConf(doc2info.box);
				let mergedDocInfo=await getBlockInfo(doc1cloneDoc.id)
				let mergedDocFullHpath=await api.getFullHPathByID(doc1cloneDoc.id)


				if (1) {
					msg_bar.innerHTML="准备创建临时文档"
					await delayMs(2000, "开始创建临时合并文档")
					//创建临时文档,为了刷新文件树,使合并得到的新文件显示出来
					// let tmpDocId = await  api.createDocWithMd("20210808180117-czj9bvb","/临时文档"+util.curtime(),"我是临时文档");
					let tmpDocId = await  api.createDocWithMd(doc1info.box,doc1info.hpath+" -临时文档","我是临时文档");
					console.log("tmpDocId:"+tmpDocId)
					let tmpDocInfo =await getBlockInfo(tmpDocId)
					// msg_bar.innerHTML="即将删除临时文档"
					// await delayMs(5000, "删除临时文档")
					await api.removeDoc(tmpDocInfo.box,tmpDocInfo.path)
					msg_bar.innerHTML="合并完成"
					// msg_bar.innerHTML="合并完成<br>"+mergedDocInfo.hpath
					// document.getElementById("merged_doc_id").innerHTML=mergedDocInfo.id
					// document.getElementById("merged_doc_hpath").innerHTML=mergedDocInfo.hpath
					document.getElementById("merged_doc_hpath").innerHTML=mergedDocFullHpath //完整hpath,单独api获取
					last_merge_result_doc_id=mergedDocInfo.id
				}
				// console.log("合并完成,合并结果:"+mergedDocInfo.id)
				console.log("summary:")
				// console.log("文档1:"+doc1info.hpath)
				console.log("文档1:"+doc1notebookConf.name+"|"+doc1info.hpath)
				console.log("文档2:"+doc2notebookConf.name+"|"+doc2info.hpath)
				// console.log("合并后路径:"+"|"+mergedDocInfo.hpath)
				console.log("合并后路径:"+""+mergedDocFullHpath)
				console.log("合并后id:"+""+mergedDocInfo.id)

			}
		}
	}


}


async function delete_last_merged_doc() {
	console.clear()
	console.log("--------------------------------"+new Date().toLocaleString())

	console.log("全局变量:"+last_merge_result_doc_id)
	if (!last_merge_result_doc_id) {
		console.log("不存在")
		alert("没有上次合并结果")
	}else {
		let mergedDocInfo = await getBlockInfo(last_merge_result_doc_id);
		console.log("mergedDocInfo:"+JSON.stringify(mergedDocInfo))
		await api.removeDoc(mergedDocInfo.box,mergedDocInfo.path)
		console.log("删除合并文档完成:"+last_merge_result_doc_id)
		// 因为文档已删除,故删除变量,
		last_merge_result_doc_id=""
		alert("已删除文档:"+mergedDocInfo.hpath)
	}
	return;
	// let doc1id=$("#doc1_id_input").value
	let merged_doc_id = document.getElementById("merged_doc_id").innerHTML.trim();
	if (merged_doc_id) {
		console.log("merged_doc_id:"+merged_doc_id);
		await api.removeDoc()
	}else {
		console.log("没有上次合并结果");
	}
}

//获取兄弟文档(包括自身)的id和path等
async function getSiblingDocsInfo(blockIdArg) {
		let blockId
		blockId="20200922101913-d5yitmq"
		blockId="20220415190432-r3xqn3r"
		blockId=blockIdArg
		// blockId=blockId_arg
		let blockInfo = await getBlockInfo(blockId);
		console.log("列出子文档2:")
		// let promise = await api.listDocsByPath("20220717131443-gdf3hhd","/20220731202400-4css9vf");
		// let promise = await api.listDocsByPath("20220419113307-12eyc3q","/");   //试试path为空
		// let doc1_sub_docs = await api.listDocsByPath(curBlock1.box,doc1_parent_path);   //试试path为空
		let doc1_sub_docs = await api.listDocsByPath(blockInfo.box,blockInfo.dir_path);   //试试path为空
		console.log("doc1_sub_docs:"+doc1_sub_docs)
		console.log("doc1_sub_docs str:"+JSON.stringify(doc1_sub_docs))
		//获取所有兄弟文档的id/path/name
		let doc1_sibling_doc_ids=[]
		let doc1_sibling_doc_paths=[]
		let doc1_sibling_doc_names=[]
		doc1_sub_docs.files.forEach((item,index)=>{doc1_sibling_doc_ids.push(item.id)})
		doc1_sub_docs.files.forEach((item,index)=>{doc1_sibling_doc_paths.push(item.path)})
		doc1_sub_docs.files.forEach((item,index)=>{doc1_sibling_doc_names.push(item.name)})
		if (1) {
			console.log("doc1_sibling_doc_ids:" + doc1_sibling_doc_ids.join("\n"));
			console.log("doc1_sibling_doc_paths:" + doc1_sibling_doc_paths.join("\n"));
			console.log("doc1_sibling_doc_names:" + doc1_sibling_doc_names.join("\n"));
		} else {
			console.log("doc1_sibling_doc_ids:"+doc1_sibling_doc_ids)
			console.log("doc1_sibling_doc_paths:"+doc1_sibling_doc_paths)
			console.log("doc1_sibling_doc_names:"+doc1_sibling_doc_names)
		}
	let ret={
		siblingDocIds: doc1_sibling_doc_ids,
		siblingDocPaths: doc1_sibling_doc_paths,
		siblingDocNames: doc1_sibling_doc_names,
		blockInfo:blockInfo
	}
	return ret
}
// 调用api 把字符串写到新建sy文件中
async function putFile2(path, filedata, isDir = false, modTime = Date.now(), token = "") {
    let blob = new Blob([filedata]);
    let file = new File([blob], path.split('/').pop());
    let formdata = new FormData();
    formdata.append("path", path);
    formdata.append("file", file);
    formdata.append("isDir", isDir);
    formdata.append("modTime", modTime);
    const response = await fetch(
        "/api/file/putFile",
        {
            body: formdata,
            method: "POST"
        });
    if (response.status === 200){
        return await response.json();
        // return response;
	} else {
		return null;
	}
}

//延迟 特定毫秒,到时打印特定消息; 使用时await delayMs(1000, "时间到")
function delayMs(delayMs, message) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            console.log(message);
            resolve();
        }, delayMs);
    });
}
