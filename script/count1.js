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
	duplicateDoc, refreshFiletree, listDocsByPath, getFullHPathByID, getBlockDOM, getDocInfo
} from './api.js';
// import {config} from "./config";
// console.log("开始2345")
const fs = window.parent.require('fs');
// const fs = window.require('fs');
// console.log("比较:"+(window==window.parent))
// console.log("window:"+window)
// console.log("window2:"+window.parent)

var flag = 0;
var auto_counter;
var sub_doc_idx=0;
var newdocid_global;
let msg_bar = document.getElementById('process_msg')
//全局变量,表示上次新创建的块的id,该块用来显示挂件输出信息
let lastNewCreatedBlockID
//断言函数
function assert(condition, message) {
	// console.assert(condition,message)
    if (!condition) {
        throw new Error(message || "断言失败!");
    }
}
//序列化, 使用制表符缩进
function beautify(obj) {
	return JSON.stringify(obj,null,"\t")
}
// 获取挂件所在块信息
function getWidgetBlockInfo() {
	let widgetBlockEle = window.frameElement.parentElement.parentElement;
	let widgetBlkID = widgetBlockEle.getAttribute('data-node-id');
	let ret={
		id:widgetBlkID
	}
	return ret
}
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
	blockId=blockIdArg //一级文档
	console.log("getBlockInfo-blockId:"+blockId)
	let blockFullHPath = await api.getFullHPathByID(blockId);
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
	let isDoc
	// rootID是块所在文档的id, 如果块id等于文档id,则该块是文档块
	isDoc= blockId===curBlock1.rootID

	let ret = {
		dir_path:doc1_parent_path,
		path:curBlock1.path,
		hpath:curBlock1Hpath,// 通过单独api获取
		fullhpath:blockFullHPath,// 通过单独api获取
		box:curBlock1.box,
		id:blockId,
		blockAttrs: blockAttrs,
		title: blockAttrs.title, //或者 curBlock1.rootTitle
		rootID:curBlock1.rootID, //所在文档id
		isDoc:isDoc
	};
	return ret
}

//在指定块后面插入内容
//如果未指定参数,则使用挂件块id
async function insert_after_widget_block(dataArg) {
	let blockId;
	// if (!blockIdArg) {
	// 	id = getWidgetBlockInfo().id;
	// }else {
	// 	id=blockIdArg
	// }
	// blockId = blockIdArg || getWidgetBlockInfo().id
	if (!lastNewCreatedBlockID) {
		blockId=getWidgetBlockInfo().id  //使用挂件块
	}else {
		blockId=lastNewCreatedBlockID
	}
	let data

	data="foo**bar**{: style=\"color: var(--b3-font-color8);\"}baz"
	data="foo**bar**{: style=\"color: var(--b3-font-color8);\"}baz"+util.curtime()
	data=dataArg
	let newVar = await api.insertBlock(blockId,data);
	console.log("挂件块id:"+blockId)
	console.log("newVar:"+newVar)
	console.log("newVar:"+beautify(newVar))
	console.log("newVar新块id:"+beautify(newVar[0].doOperations[0]))
	console.log("newVar新块id:"+newVar[0].doOperations[0].id)
	let newBlockId=newVar[0].doOperations[0].id
	lastNewCreatedBlockID=newBlockId
	return newBlockId
}
//刷新文档树,重建索引
async function refreshFileTreeBtnMain(){
	console.log("重建索引....")
	msg_bar.innerHTML="重建索引中....."
	await refreshFiletree()
	msg_bar.innerHTML="重建索引完成,合并结束"

}
document.getElementById('refreshFileTreeBtn').addEventListener('click', function () {

	refreshFileTreeBtnMain().then(r => {});   //主

});


document.getElementById('begin_merge_btn').addEventListener('click', function () {
	console.clear()
	create_sub_doc_demo5_merge().then(r => {});   //主

});

async function create_sub_doc_demo5_merge() {
	// document.getElementById('check_update').innerHTML = '点击下载';
	let msg_bar = document.getElementById('process_msg');
	// let msg_bar = $("#process_msg");
	console.clear()
	// console.log("--------------------------------")
	console.log("--------------------------------" + new Date().toLocaleString())
	// console.log("设置全局:"+new Date().toLocaleString())
	// last_merge_result_doc_id=new Date().toLocaleString()
	// last_merge_result_doc_id="20220817205457-wejcldv"
	// await clone_and_merge()
	// await test_getRefIDs()
	// await test_api_getDocInfo()
	// await test_api_getBlockInfo()
	// await test_api_getBlockAttrs()
	// await test_exportMdContent()
	// await test_backupdoc()   //备份
	await merge_no_changeId_main() // 220822_120201
}
async function merge_no_changeId_main(){
	console.log("当前count-22-8-23-1.js")
	// return
	let doc1id,doc2id
	doc1id="20220823070621-9bixnwq"
	doc2id="20220823070632-h225miz"
	if (1) {
		doc1id = document.getElementById("doc1_id_input").value.trim()
		doc2id = document.getElementById("doc2_id_input").value.trim()
	}
	if (1) {
		//检查文档
		await checkDocInfoBeforeMerge(doc1id,doc2id)
		console.log("merge_no_changeId_main 检查结束")
	}
	// return
	console.log("doc1id:"+doc1id)
	console.log("doc2id:"+doc2id)


	//备份两个文档到txt中
	// 拼接两个文档内容
	lastNewCreatedBlockID=null
	await insert_after_widget_block("两个文档的原始sy文件将被备份到相应位置的txt文件中")

	await test_backupdoc(doc1id)
	await test_backupdoc(doc2id)

	await test_change_dom_target1(doc2id,doc1id)
	await merge_no_change_id(doc1id,doc2id)
	msg_bar.innerHTML="即将完成,请点击按钮3重建索引"

	// console.log("刷新文件树:")
	// msg_bar.innerHTML="准备重建索引..."
	// await delayMs(2000)
	// await api.refreshFiletree()
	// msg_bar.innerHTML="合并完成"
	// await api.refreshFiletree()
	// 获取文档2的引用,去重,遍历引用块 修改引用目标指向文档1
	// 删除文档1和2
	// 将合并内容写入文档1
}
//根据文档id备份文档到同目录的同名txt文件中
async function test_backupdoc(docIdArg) {
	// assert(0,"test_backupdoc")
	if (0) {
		let doc1_path
		doc1_path="dddsd"
		doc1_path="20220820170748-xsczyal"
		doc1_path="/data/20220717131443-gdf3hhd/20220820161719-y26fv9v/20220820170748-xsczyal.sy"
		doc1_path="/data/"

		let newVar = await getFileContent(doc1_path);
		console.log("newVar:"+newVar)
		console.log("newVar type:"+(typeof newVar))
		console.log("newVar str:"+JSON.stringify(newVar))
	}
	// return
	let docid;
	docid="20220820170748-xsczyal"
	docid="20200825162036-4dx365o" //排版元素
	if(docIdArg){docid=docIdArg}

	// await api.putFile()
	let doc1info = await getBlockInfo(docid);
	assert(doc1info.box,"dsaf")
	let doc1_path
	doc1_path="/data/"+doc1info.box+doc1info.path
	// doc1_path="fffffsafsa"
	// doc1_path="/data"
	console.log("doc1_path:"+doc1_path)
	let doc1_sy_content;
	// doc1_sy_content= await getFileContent(doc1_path);
	doc1_sy_content = await getFileContent(doc1_path);
	assert(doc1_sy_content,"获取文档内容失败:"+doc1_path)
	// return
	console.log("after call")
	console.log("doc1_sy_content:"+doc1_sy_content)
	console.log("doc1_sy_content str:"+JSON.stringify(doc1_sy_content))
	console.log("doc1_sy_content type:"+(typeof doc1_sy_content))
	// return
	if(1){
		//备份到同目录的txt文件中
		let backupPath = "/data/"+doc1info.box+doc1info.path+".txt";
		console.log("backupPath:"+backupPath)
		let save_data
		// save_data=JSON.stringify(doc1_sy_content)
		// save_data=JSON.stringify(doc1_sy_content,null,4)   //缩进4个空格
		save_data=JSON.stringify(doc1_sy_content,null,"\t")   //制表符缩进
		let putfile_ret = await putFile2(backupPath,save_data);
		console.log("putfile_ret:"+putfile_ret)
		console.log("putfile_ret str:"+JSON.stringify(putfile_ret))
		console.log("备份完成,文档id:"+docid)
	}

}
async function test_change_dom_target1(oriDocIdArg,newDocIdArg) {
	// 清空上次插入的块,则新块插入挂件块后面
	// lastNewCreatedBlockID=null

	if ("") {
		// 测试改名
		let docId
		docId="20220731202356-lb6qyds" //15
		let targetDocInfo = await getBlockInfo(docId);
		let oldName
		oldName = targetDocInfo.title
		console.log("targetDocInfo:" + targetDocInfo)
		await api.renameDoc(targetDocInfo.box, targetDocInfo.path, oldName + "(挂件12)")
		// await api.renameDoc(targetDocInfo.box, targetDocInfo.path, "15Doc")
		// await delayMs(1000)
		//名字再改回来
		// await api.renameDoc(targetDocInfo.box, targetDocInfo.path, oldName)
		return
	}
	// 原文档id对应文档2的id
	let oriDocId;
	// oriDocId="20220731202358-db8t2rw" // 19
	oriDocId="20220731202358-gmsbr5d"  //18
	oriDocId="20220731202356-ztzvsiw" // 16
	oriDocId="20220731202356-lb6qyds"  //15
	oriDocId="20220731202357-9vd104d" // 17
	oriDocId="20200813093015-u6bopdt"  //常见问题


	// 新文档id对应文档1的id
	let newDocId
	// newDocId="20220731202358-db8t2rw" // 19
	newDocId="20220731202357-9vd104d" // 17
	newDocId="20220731202358-gmsbr5d"  //18
	newDocId="20220731202356-ztzvsiw" // 16
	newDocId="20200813093015-u6bopdt"  //常见问题
	newDocId="20220731202356-lb6qyds"  //15

	if(oriDocIdArg){oriDocId=oriDocIdArg}
	if(newDocIdArg){newDocId=newDocIdArg}
	let targetDocInfo = await getBlockInfo(newDocId);
	console.log("targetDocInfo:"+targetDocInfo)
	console.log("targetDocInfo str:"+JSON.stringify(targetDocInfo))
	// console.log("targetDocInfo str b:"+beautify(targetDocInfo))

		let isSwap
	// isSwap=document.getElementById("arg1").value
	if ("") {
		console.log("参数交换:")
		//交换
		let tmp_id
		tmp_id=newDocId
		newDocId=oriDocId
		oriDocId=tmp_id
	}

console.log("oriDocId:"+oriDocId)
console.log("newDocId:"+newDocId)


	if(1){
		//检查谁引用了文档2
		let oriDocInfo = await api.getDocInfo(oriDocId);
		console.log("oriDocInfo:"+oriDocInfo)
		// console.log("oriDocInfo:"+JSON.stringify(oriDocInfo))
		console.log("oriDocInfo str:"+beautify(oriDocInfo))
		let oriDocRefIDs = oriDocInfo.refIDs;
		console.log("oriDocInfo refIDs:"+oriDocRefIDs)
		for (let i = 0; i < oriDocRefIDs.length; i++) {
			console.log(`-${i} ${oriDocRefIDs[i]}`)
		}
		//去重
		let oriDocRefIDsSet = Array.from(new Set(oriDocRefIDs))
		console.log("oriDocRefIDsSet:"+oriDocRefIDsSet)

		if (1) {
			//挨个修改 引用目标
			let flag_change
			let refBlockPosition
			refBlockPosition=[]
			//获取新文档的名字,作为动态引用的锚文本
			let targetDocInfo = await getBlockInfo(newDocId);
			let refNewText;
			refNewText = targetDocInfo.title;
			if (oriDocRefIDsSet.length) {
				await insert_after_widget_block("文档2的反链如下:(将被指向文档1)")
			}
			for (let j = 0; j <oriDocRefIDsSet.length; j++) {
				let refBlockId=oriDocRefIDsSet[j];
				console.log(`+${j} ${refBlockId}`);
				if (1) {
					//获取引用块的信息
					let refBlockInfo = await getBlockInfo(refBlockId);
					// ((20220731202353-6zjcrwc 'dffffffdfsafsafsd'))
					let newBlockContent;
					// newBlockContent = `((${refBlockId} '引用位置${j + 1}:${refBlockInfo.fullhpath}'))`;
					newBlockContent = `((${refBlockId} "引用位置${j + 1}:${refBlockInfo.fullhpath}"))`;
					// newBlockContent = `((${refBlockId} "引用位置${j + 1}"))`;
					refBlockPosition.push(newBlockContent);
					console.log("打印内容:"+newBlockContent)
					await insert_after_widget_block(newBlockContent)
				}
				flag_change=1;
				if (flag_change) {
					//修改引用块的指向目标  #
					await changeBlockDefID(oriDocRefIDsSet[j],oriDocId, newDocId,refNewText);
				}

			}
			if (1) {
				//获取更新block之后文档的内容,看是否实时变化

			}
			if (0) {
				//更新: 不需要重命名了,现在在修改引用块的目标时,把动态锚文本也设置了,见 changeBlockDefID
				//重命名新文档,来更新引用块的动态锚文本; 建议修改所有引用块之后再执行
				let targetDocInfo = await getBlockInfo(newDocId);
				let oldName;
				oldName = targetDocInfo.title;
				console.log("targetDocInfo:" + targetDocInfo);
				await api.renameDoc(targetDocInfo.box, targetDocInfo.path, oldName + "(挂件修改)");
				await delayMs(1000);
				//名字再改回来
				await api.renameDoc(targetDocInfo.box, targetDocInfo.path, oldName);
			}
			console.log("汇总信息:")
			console.log("\n"+refBlockPosition.join("\n"))
		}
	}


}
async function merge_no_change_id(doc1idArg,doc2idArg) {
	// let msg_bar = document.getElementById('process_msg');
	let doc1id;
	let doc2id;
	console.log("开始merge_no_change_id")
	// return
	doc1id = "20200813004931-q4cu8na"; //什么是内容块
	doc2id = "20200813013559-sgbzl5k"; //引用内容块

	doc1id = "20220820183222-jyafpf9"; //文档1
	doc2id = "20220820183219-qdki3px"; //文档2
	if (doc1idArg) {doc1id=doc1idArg}
	if (doc2idArg) {doc2id=doc2idArg}

	console.log("doc1id:"+doc1id);
	console.log("doc2id:"+doc2id)
	if(1){
		let doc1info = await getBlockInfo(doc1id);
		let doc2info = await getBlockInfo(doc2id);
		let doc1_sy_content= await getFileContent("/data/"+doc1info.box+doc1info.path)
        let doc2_sy_content= await getFileContent("/data/"+doc2info.box+doc2info.path)

        let concat = doc1_sy_content.Children.concat(doc2_sy_content.Children);
        // let concat = doc1_sy_content.Children.concat(paragraph_template).concat(doc2_sy_content.Children);
        console.log("concat:"+JSON.stringify(concat))

		if (1) {
			//移除文档1
			let rmDoc1Ret = await api.removeDoc(doc1info.box,doc1info.path);
			console.log("移除rmDoc1Ret:"+rmDoc1Ret)
			let rmDoc2Ret = await api.removeDoc(doc2info.box,doc2info.path);
			console.log("移除rmDoc2Ret:"+rmDoc2Ret)
		}
		if (1) {

				// await delayMs(2000, "删除后等待一会")
				//重写文档1
				let path = "/data/"+doc1info.box+doc1info.path;
				console.log("合并文档路径:"+path)
				doc1_sy_content.Children=concat
				//缩进
				let saveData = JSON.stringify(doc1_sy_content,null,"\t");
				let putfile_ret=await putFile2(path,saveData);
				console.log("写完成:"+putfile_ret);
				console.log("写完成str:"+JSON.stringify(putfile_ret));
				//重命名新文档1
			if (1) {
				// await api.renameDoc(doc1cloneDoc.box,doc1cloneDoc.path,"合并 "+util.curtime()); //for dbg
				// await api.renameDoc(doc1info.box,doc1info.path,doc1info.title); //for dbg
				// console.log("重命名完毕")
			}
			if(1){
				//创建临时文档,目的是为了让新文档1显示出来
					msg_bar.innerHTML="准备创建临时文档"
					await delayMs(2000, "开始创建临时合并文档")
					let tmpDocId = await  api.createDocWithMd(doc1info.box,doc1info.hpath+" -临时文档","我是临时文档");
					console.log("tmpDocId:"+tmpDocId)
					let tmpDocInfo =await getBlockInfo(tmpDocId)
					//删除临时文档
					await api.removeDoc(tmpDocInfo.box,tmpDocInfo.path)

					msg_bar.innerHTML="合并完成"

			}

		}

	}


}
// path.split('/').pop() 表示最后一个/分割的部分,作为文件名(没有父目录)
//path 是包括文件名在内的完整路径
async function putFile2(path, filedata, isDir = false, modTime = Date.now(), token = "") {
    let blob = new Blob([filedata]);
    let file = new File([blob], path.split('/').pop());
    let formdata = new FormData();
    formdata.append("path", path);
    formdata.append("file", file);
    formdata.append("isDir", isDir);
    formdata.append("modTime", modTime);
	if (1) {
		console.log("putFile2 path:"+path)
		console.log("putFile2 file:"+file)
		console.log("putFile2 file.name:"+file.name) //work,
		console.log("putFile2 file.text:"+file.text())
		console.log("putFile2 filename :"+path.split('/').pop())
	}
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
async function changeBlockDefID(blockIdArg,oriDocId, newDocId,refNewText) {
	let blockId;
	blockId = "20220820201453-3fohrjf";
	// blockId = "20220820202102-vzr3mww"; //空块
	blockId = "20220821070519-mmzth5b"; //
	blockId = blockIdArg; //
	let newVar = await api.getBlockDOM(blockId);
	// console.log("getBlockDOM ret:"+newVar)
	// console.log("getBlockDOM ret-type:"+(typeof newVar))
	// console.log("newVar-str:"+JSON.stringify(newVar))
	// console.log("getBlockDOM ret.data:"+JSON.stringify(newVar.data))
	// console.log("getBlockDOM ret.data-type:"+(typeof newVar.data))

	console.log("dom:" + newVar.data.dom)
	console.log("dom-type:" + (typeof newVar.data.dom))  //是字符串
	// console.log("dom1:"+newVar.data.dom.getAttribute("data-type"))
	// console.log("dom1:"+newVar.data.dom.getAttribute("data-type"))
	// console.log("dom1:"+newVar.data.dom.data-type)
	let element = await htmlToElement(newVar.data.dom);
	console.log("element ret outerHTML:" + element.outerHTML)
	console.log("element ret innerHTML:" + element.innerHTML)
	console.log("element-str:" + JSON.stringify(element))

	if (0) {
		//修改 dom属性
		// element.appendChild()
		// let block_ref_eles = element.querySelectorAll("span");
		// let block_ref_eles = element.querySelector("span");
		let block_ref_eles = element.querySelector("span[data-type=block-ref]");
		let ref_target = block_ref_eles.getAttribute("data-id");
		console.log("ref_target:" + ref_target)
		console.log("block_ref_eles:" + block_ref_eles.innerHTML)
		block_ref_eles.setAttribute("data-id", "555555555")
		console.log("block_ref_eles:" + block_ref_eles.outerHTML)
		console.log("over")

	}
	if (1) {
		//多元素情况
		// let block_ref_eles = element.querySelector("span[data-type=block-ref]");
		let block_ref_eles = element.querySelectorAll("span[data-type=block-ref]");
		let refTextType
		for (let i = 0; i < block_ref_eles.length; i++) {
			let blockRefEle = block_ref_eles[i];
			let ori_data_id = blockRefEle.getAttribute("data-id");
			console.log("- " + i + " ori_data_id:" + ori_data_id)
			console.log("- " + i + " ori_innerHTML:" + blockRefEle.innerHTML)
			let isTarget;
			isTarget = ori_data_id === oriDocId
			if (isTarget) {
				//data-id是特定文档id时才更改
				blockRefEle.setAttribute("data-id", newDocId)
				// blockRefEle.setAttribute("data-blockId","124435")
				if(1){
					//如果是动态块引用,锚文本修改为新文档的名字,即参数refNewText
				 	refTextType = blockRefEle.getAttribute("data-subtype");
					if (refTextType!=="s") {
						//动态锚文本,则修改
						blockRefEle.innerHTML=refNewText;
					}
				}
			}
		}
	}

	if (1) {
		console.log("element outerHTML:" + element.outerHTML);
		console.log("element outerHTML type:" + (typeof element.outerHTML));
	}
	if (1) {
		// 将 dom更新到原来的块
		let blockNewDom
		blockNewDom = element.outerHTML
		let updateBlock = await api.updateBlock(blockId, "dom", blockNewDom);
		console.log("updateBlock ret:" + updateBlock)
		console.log("updateBlock ret str:" + JSON.stringify(updateBlock))

		if (0) {
			//重命名新文档,来更新引用块的动态锚文本; 建议修改所有引用块之后再执行
			let targetDocInfo = await getBlockInfo(newDocId);
			let oldName
			oldName = targetDocInfo.title
			console.log("targetDocInfo:" + targetDocInfo)
			await api.renameDoc(targetDocInfo.box, targetDocInfo.path, oldName + "(挂件修改)")
			await delayMs(1000)
			//名字再改回来
			await api.renameDoc(targetDocInfo.box, targetDocInfo.path, oldName)
		}
	}
}
async function htmlToElement(html) {
	// let template = document.createElement('template');
	// let template = document.createElement('template');
	// let template = window.parent.document.createElement('template');
	// let template = document.getElementsByTagName("template")[0];
	let template = document.getElementById("template_ele");
	console.log("template innerHTML:"+template.innerHTML)
	console.log("template outerHTML:"+template.outerHTML)
	console.log("template:"+template)
	console.log("template content:"+template.content)

	console.log("template str:"+JSON.stringify(template))
	html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
	console.log("template outerHTML2:"+template.outerHTML)
	console.log("template innerHTML2:"+template.innerHTML)

	console.log("1template.content str:"+JSON.stringify(template.content))
	console.log("2template.content str:"+JSON.stringify(template.content.firstChild))
    // return template.content.firstChild;
	return template.content.firstElementChild;
	// return template.content;

}
//延迟 特定毫秒,到时打印特定消息;返回promise 使用时await print(1000, "时间到")
function delayMs(delayMs, message="时间到") {
    return new Promise(function (resolve, reject) {
		console.log(`等待${delayMs}毫秒...`)
        setTimeout(function () {
            console.log(message);
            resolve();
        }, delayMs);
    });
}
//检查 按钮
 $("#check_doc_info_btn").click(function () {
	console.clear()
	console.log("--------------------------------"+new Date().toLocaleString())
	 checkDocInfoBeforeMerge().then(r => {})
 })
async function checkDocInfoBeforeMerge(doc1idArg,doc2idArg) {
	document.getElementById("doc1_info").innerHTML=""
	document.getElementById("doc2_info").innerHTML=""
	 // console.log("第三方:"+document.getElementById('doc1_id_input').innerHTML)
	 console.log("第三方2:"+document.getElementById('doc1_id_input').value+";")
	let doc1id;
	let doc2id;
	//默认检查输入框指定的文档
	doc1id = document.getElementById('doc1_id_input').value;
	doc2id = document.getElementById('doc2_id_input').value;
	if(doc1idArg!=undefined||doc2idArg!=undefined){
		doc1id=doc1idArg
		doc2id=doc2idArg
		console.log("checkDocInfoBeforeMerge 检查参数对应文档:"+doc1idArg+" 和 "+doc2idArg)
	}else {
		console.log("checkDocInfoBeforeMerge 检查输入框对应文档:"+doc1id+" 和 "+doc2id)
	}
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
			 throw "获取文档1信息失败,可能文档不存在"
			 // assert()
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
			 throw "获取文档2信息失败,可能文档不存在"
		 }

	 }else {
		 document.getElementById("doc2_info").innerHTML = "文档2 ID为空"
		 console.log("空doc2id")
	 }
}
