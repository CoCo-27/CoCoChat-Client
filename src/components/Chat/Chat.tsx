import React, { useState, useRef, useEffect } from 'react';
import { Upload, notification } from 'antd';
import ChatMessage from '../ChatMessage/ChatMessage';
import uploadServices from 'src/services/uploadServices';
import titleServices from 'src/services/titleServices';
import { isEmpty } from 'src/utils/isEmpty';
import backend_api from 'src/config';

const { Dragger } = Upload;

const Chat = ({
  text,
  buttonFlag,
  setLoading,
  setButtonFlag,
  setHistoryFlag,
}) => {
  const inputRef = useRef();
  const [formValue, setFormValue] = useState('');
  const [files, setFiles] = useState([]);
  const [fileName, setFileName] = useState(
    localStorage.getItem('fileName') ? localStorage.getItem('fileName') : ''
  );
  const [fileRealName, setFileRealName] = useState(
    localStorage.getItem('fileRealName')
      ? localStorage.getItem('fileRealName')
      : ''
  );
  const [title, setTitle] = useState('');
  const [promptValue, setPromptValue] = useState('');
  const [array, setArray] = useState([]);

  const req_qa_box = useRef(null);

  const props = {
    name: 'file',
    action: backend_api + 'upload/file',
    onChange: (info) => {
      setFiles(info.fileList);
      if (info.file.status === 'done') {
        notification.success({
          description: `${info.file.response.originalname} Upload Success`,
          message: '',
        });
      }
      if (info.file.status === 'error') {
        notification.error({
          description: `${info.file.originFileObj.name} Upload Failed`,
          message: '',
        });
      }
    },
    beforeUpload: async (info) => {
      setLoading(true);
      if (
        info.type === 'application/pdf' ||
        info.type === 'application/msword' ||
        info.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        if (info.size < 1024 * 1024 * 10) {
          let formData = new FormData();
          info.email = localStorage.getItem('email');

          formData.append('file', info);
          formData.append('data', localStorage.getItem('email'));

          try {
            const response = await fetch(backend_api + 'upload/file', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            setLoading(false);
            if (!data) {
              notification.error({
                message: 'Error',
                description: 'File Upload Error',
                duration: 2,
              });
              return false;
            }
            if (data) {
              if (data.code === 200) {
                notification.success({
                  message: 'Success',
                  description: `${data.data.originalname} Upload Success`,
                  duration: 2,
                });
                setFileRealName(data.data.originalname);
                localStorage.setItem('fileRealName', data.data.originalname);
                setFileName(data.data.filename);
                localStorage.setItem('fileName', data.data.filename);
                return false;
              } else {
                notification.error({
                  message: 'Error',
                  description: data.message,
                  duration: 2,
                });
                return false;
              }
            }
          } catch (error) {
            setLoading(false);
          }
        } else {
          setLoading(false);
          notification.error({
            description: `${info.name} must smaller than 10MB!`,
            message: '',
          });
          return false;
        }
      } else {
        setLoading(false);
        notification.error({
          description: 'You can only upload PDF/DOC file!',
          message: '',
        });
        return Upload.LIST_IGNORE;
      }
    },
    files,
  };

  useEffect(() => {
    req_qa_box.current.scrollTop = req_qa_box.current.scrollHeight;
    if (!isEmpty(text.data)) {
      const save = array.slice();
      if (text.type === false) {
        save.push({ message: text.data, flag: false });
        save.push({ message: '...', flag: true });
      } else {
        save[save.length - 1].message = text.data;
        save[save.length - 1].flag = true;
      }
      setArray(save);
    }

    titleServices
      .getTitle()
      .then((result) => {
        setTitle(result.data.data[0].title);
      })
      .catch((error) => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const handleEmbedding = (e) => {
    setLoading(true);
    e.preventDefault();
    setFiles([]);
    uploadServices
      .embedding(
        localStorage.getItem('fileName'),
        localStorage.getItem('email')
      )
      .then((result) => {
        setLoading(false);
        notification.success({
          description: `${result.data}`,
          message: '',
        });
      })
      .catch((error) => {
        setLoading(false);
        notification.error({
          description: 'Someting went Wrong',
          message: '',
          duration: 2,
        });
      });
  };

  const handleCancel = (e) => {
    setFileName('');
    localStorage.setItem('fileName', '');
    setButtonFlag(false);
    localStorage.setItem('disable_flag', JSON.stringify(false));
  };

  const handlePressEnter = (e) => {
    if (e.key === 'Enter' && formValue && fileName) {
      handleMessage();
    }
  };

  const handleMessage = async () => {
    setFormValue('');
    const save = array.slice();
    save.push({ message: formValue, flag: false });
    save.push({ message: '...', flag: true });
    setArray(save);
    uploadServices
      .requestMessage(formValue, localStorage.getItem('email'))
      .then((res) => {
        const update = save.slice();
        update[update.length - 1].message = res.data.text;
        update[update.length - 1].flag = true;
        setArray(update);
        setHistoryFlag('true');
        localStorage.setItem('historyFlag', 'true');
      })
      .catch((err) => {
        notification.error({
          description: err.response.data.message,
          message: '',
          duration: 2,
        });
      });
  };

  return (
    <div className="flex w-4/6 min-w-min">
      <div className="h-full flex flex-col flex-1 justify-between pl-24 pr-24 py-4 duration-500 overflow-hidden relative bg-white">
        <div className="relative h-full flex flex-col">
          <div className="relative flex w-full flex-col p-2 rounded-md border border-black/10 shadow-[0_0_10px_rgba(0,0,0,0.10)] ">
            <input
              ref={inputRef}
              className="m-0 w-full resize-none border-0 overflow-hidden bg-transparent py-2 text-black dark:bg-transparent dark:text-white md:py-2 md:pl-4"
              value={promptValue}
              placeholder={title}
              onChange={(e) => setPromptValue(e.target.value)}
              style={{
                maxHeight: '400px',
                height: '44px',
              }}
            />
          </div>
          <div
            ref={req_qa_box}
            className="relative flex w-full h-64 flex-grow flex-col mt-4 rounded-md border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] overflow-y-auto overflow-x-hidden"
          >
            {!isEmpty(array) ? (
              array.map((item, index) => {
                return (
                  <ChatMessage
                    key={index}
                    box_ref={req_qa_box}
                    message={item.message}
                    status={item.flag}
                  />
                );
              })
            ) : (
              <></>
            )}
          </div>

          {fileName ? (
            <div className="flex flex-row w-full gap-5 justify-center">
              <button
                className={`mt-4 tracking-wide font-semibold bg-green-400 text-white w-full p-4 rounded-lg hover:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.3),0_4px_18px_0_rgba(51,45,45,0.2)] transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none ${
                  buttonFlag === true ? 'opacity-50' : 'opacity-100'
                }`}
                onClick={(e) => handleEmbedding(e)}
                disabled={buttonFlag}
              >
                {fileRealName} Uploaded
              </button>
              <button
                className="mt-4 tracking-wide font-semibold bg-red-900 text-white w-full p-4 rounded-lg hover:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.3),0_4px_18px_0_rgba(51,45,45,0.2)] transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none"
                onClick={(e) => handleCancel(e)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <Dragger
              {...props}
              className="mt-4 rounded-lg cursor-pointer bg-gray-50 h-32"
              maxCount={1}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon flex justify-center">
                <svg
                  aria-hidden="true"
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
              </p>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
            </Dragger>
          )}
        </div>

        <div className="relative flex w-full flex-col mt-4 p-2 rounded-md border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] ">
          <input
            ref={inputRef}
            className="m-0 w-full resize-none border-0 overflow-hidden bg-transparent py-2 pr-8 text-black dark:bg-transparent dark:text-white md:py-2 md:pl-4"
            value={formValue}
            required
            placeholder="SELECT A QUICK QUESTION OR ASK YOUR OWN QUESTION HERE........."
            onChange={(e) => setFormValue(e.target.value)}
            style={{
              maxHeight: '400px',
              height: '44px',
            }}
            onKeyDown={(e) => handlePressEnter(e)}
          />
          <button
            className="absolute right-2 top-2 rounded-sm m-3 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900"
            disabled={formValue && fileName ? false : true}
            onClick={() => handleMessage()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="tabler-icon tabler-icon-send"
            >
              <path d="M10 14l11 -11"></path>
              <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
