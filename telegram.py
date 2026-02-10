import excel2img
import os
import time
import requests
from datetime import datetime

#  ตั้งค่า token to access bot_telegram
with open('setting/bot_token.txt', 'r', encoding='utf-8') as file:
    bot_token  = file.read()
    print(bot_token)

#  ตั้งค่า Client ID ของ Imgur
with open('setting/IMGUR_CLIENT_ID.txt', 'r', encoding='utf-8') as file:
    IMGUR_CLIENT_ID  = file.read()
    print(IMGUR_CLIENT_ID)

def send_telagram_message(message,token_G1):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": token_G1,
        "text": message
    }

    response = requests.post(url, data=payload)
    print(response.json())
    if response.status_code == 200:
        print("Message sent successfully!")
    else:
        print(f"Failed to send message: {response.status_code}, {response.text}")


def sendphoto(token_G1,filename2,num):
    chatID = token_G1
    apiURL = f'https://api.telegram.org/bot{bot_token}/sendPhoto'
    files = {'photo': open(filename2, 'rb')}
    try:
        response = requests.post(apiURL, files=files, data={'chat_id': chatID,"caption": "รูปภาพที่ "+ str(num)})
        print(response.text)
        print("Image sent successfully!")
    except Exception as e:
        print(e)
        print(f"Failed to send image: {response.status_code}, {response.text}")

def my_remove_sel():
    listbox1.selection_clear(0, 'end')
    text1.delete('1.0', END)
    clicked_group.set("เลือกกลุ่ม")
    clicked_group2.set("เลือกกลุ่ม")



######################## อัพรูปภาพและส่งข้อมูลเข้ากลุ่ม และลบข้อมูลภาพ #####################################
def upload_and_send_images(sheet5, token_G1,):
    # ส่งข้อความเริ่มต้นไปยัง Telegram สำหรับทุก token
    for token in token_G1:
        mesdatetime = datetime.now().strftime("%d-%m-%Y %H:%M:%S")  # วันที่และเวลา
        send_telagram_message("สวัสดีทุกท่าน ส.เจริญชัย อัพเดทราคาวันที่ "+ mesdatetime,token)

    for i, _ in enumerate(sheet5):
        filename = f"{i}.png"
        
        try:
            # ส่งรูปภาพไปยัง Telegram สำหรับทุก token
            for token in token_G1:
                sendphoto(token, filename, i+1)
            
            # ลบไฟล์รูปภาพหลังอัพโหลด
            os.remove(filename)
            
        except Exception as e:
            print(f"Error processing image {filename}: {e}")
      
###

def group5():
    import PIL
    from PIL import Image

    selec_sheet = listbox1.curselection()
    sheet2 = []
    for i in selec_sheet:
        item = listbox1.get(i)
        sheet2.append(item.strip("\n"))
    print(sheet2)

    name_excel = "../รายการรับซื้อสินค้า บริษัทส.เจริญชัย รีไซเคิล จำกัด/รายการรับซื้อสินค้า บริษัทส.เจริญชัย รีไซเคิล จำกัด.xlsx" #ชื่อไฟล์ excel ตามด้วยนามสกุลไฟล์ .xlsx
    text_group = clicked_group.get()
    selec_sheet = listbox1.curselection()

    sheet5 = []
    for i in selec_sheet:
        item = listbox1.get(i)
        sheet5.append(item.strip("\n"))
######################## ตรวจสอบชีต #####################################

    if 0 == len(sheet5):
        message_group = "กรุณาเลือกชีต"
        tkinter.messagebox.showinfo("คุณยังไม่ได้เลือกชีต",message_group)
        time.sleep(0.5) 
        return
           
    try:
        f_group1 = open("token/"+text_group, "r", encoding='utf8')
    except:
        message_group = "กรุณาเลือกกลุ่ม"
        tkinter.messagebox.showinfo("คุณยังไม่ได้เลือกกลุ่ม",message_group)  
        time.sleep(0.5) 
        return

##### เก็บข้อมูล Token และชื่อกลุ่ม #########################################################

    token_G1 = []
    name_G1 = []
    for x in f_group1:
        n = x.split()[0]
        t = x.split()[1]
        name_G1.append(n + ",")
        token_G1.append(t)
##### ตรวจสอบและแจ้งเตือน ข้อมูลก่อนส่ง  ###################################################
    noti_group = str(name_G1).strip(",[]") + "\n"
    broders = "--------------------------------------------------------------" + "\n"
    noti_sheet = str(sheet5).strip(",[]")
    MsgBox = tkinter.messagebox.askquestion("โปรตรวจสอบชื่อกลุ่ม",noti_group + broders + noti_sheet,icon = 'warning')
    time.sleep(0.5) 
    if MsgBox == 'yes':
        MsgBox2 = tkinter.messagebox.askquestion('ข้อความแจ้งเตือน','คุณกำลังจะส่งข้อมูลเข้ากลุ่ม line',icon = 'warning')
        if MsgBox2 == 'yes':  
            pass
        else:
            return
    else:
        return
##### ตรวจสอบและแจ้งเตือน token ###########################################################
    if 0 == len(token_G1):
        message_group = "ยังไม่มี Token ที่จะส่ง"
        tkinter.messagebox.showinfo("กรุณาเลือกใส่ Token",message_group)
        time.sleep(0.5) 
        return
##### ดึงข้อมูลจาก Excel แปลงเป็นรูปภาพ #####################################################
    i = 0
    while i < len(sheet5):
        name_sheet = sheet5[i]  #ชื่อ sheet ตามด้วยตำแหน่งของ cell
        part_img = str(i)+".png" #ชื่อไฟล์รูปภาพที่ต้องการส่งออก ตามด้วยนามสกุลไฟล์ png/jpg/bmp

        try:
            excel2img.export_img(name_excel, part_img , "", name_sheet)
        except:
            message_group = "โปรตรวจสอบชื่อชีตอีกครั้ง"
            tkinter.messagebox.showinfo("ไม่สามารถเรียกข้อมูลชือชีตนี้ได้",message_group)
            time.sleep(0.5) 
            return
                         
        imageresize = Image.open(part_img)
        imageresize = imageresize.resize((1600,2008), PIL.Image.LANCZOS)  #ปรับขนาดรูปภาพที่ต้องการ
        imageresize.save(part_img)  #บันทึกไฟล์รูปภาพที่ปรับขนาดแล้ว
        i += 1  

##### ส่งรูปภาพตามโทเคนที่กำหนด #############################################################    
    
    upload_and_send_images(sheet5, token_G1)
    


    my_remove_sel()     
    tkinter.messagebox.showinfo("แจ้งเตือนรายชื่อกลุ่มที่ 1",name_G1)
    time.sleep(0.5)

def send_message():
    text_group = clicked_group2.get()
    input_text = text1.get("1.0", "end-1c")

    if 0 == len(input_text):
        message_group = "กรุณาเลือกใส่ข้อความ"
        tkinter.messagebox.showinfo("คุณยังไม่ได้ใส่ข้อความ",message_group)
        time.sleep(0.5) 
        return    

    print("input ="+input_text)
    print(text_group)

    try:
        f_group1 = open("token/"+text_group, "r", encoding='utf8')
    except:
        message_group = "กรุณาเลือกกลุ่ม"
        tkinter.messagebox.showinfo("คุณยังไม่ได้เลือกกลุ่ม",message_group)  
        time.sleep(0.5) 
        return

    token_G1 = []
    name_G1 = []
    for x in f_group1:
        n = x.split()[0]
        t = x.split()[1]
        name_G1.append(n + ",")
        token_G1.append(t)

    if 0 == len(token_G1):
        message_group = "ยังไม่มี Token ที่จะส่ง"
        tkinter.messagebox.showinfo("กรุณาเลือกใส่ Token",message_group)
        time.sleep(0.5) 
        return

    MsgBox = tkinter.messagebox.askquestion("โปรตรวจสอบชื่อกลุ่ม",name_G1,icon = 'warning')
    time.sleep(0.5) 
    if MsgBox == 'yes':
        MsgBox2 = tkinter.messagebox.askquestion('ข้อความแจ้งเตือน','คุณกำลังจะส่งข้อมูลเข้ากลุ่ม telegram',icon = 'warning')
        if MsgBox2 == 'yes':  
            pass
        else:
            return
    else:
        return

    for x in token_G1:  #ส่งรูปภาพตามโทเคนที่กำหนด
        text = input_text #+ "\n" + "วันที่" + now()
        try:
            send_telagram_message(text,x)
        except:
            message_group = "กรุณาตรวจสอบสัญญาณอินเตอร์เน็ต"
            tkinter.messagebox.showinfo("ไม่สามารถส่งข้อมูลเข้า telegram ได้",message_group)  
            time.sleep(0.5) 
            return

    my_remove_sel()



from tkinter import *
from tkinter import ttk
import tkinter.messagebox
from tkinter.ttk import Combobox
from tkinter import font 
from tkinter import Tk, Label, Text, Button, OptionMenu, StringVar, Menu, filedialog, messagebox, Toplevel
from PIL import Image, ImageTk  # สำหรับจัดการรูปภาพ
import time
import tkinter


GUI = Tk()
GUI.title("โปรแกรมส่งราคาเข้า Telegram")
GUI.geometry("580x500")
GUI.iconbitmap('setting/telegram.ico')

Tab = ttk.Notebook(GUI)
Tab.pack(fill=BOTH,expand=1)

T1 = Frame(Tab)
T2 = Frame(Tab)

Tab.add(T1,text="ส่งชีตเข้าเข้าเทเลแกรม")
Tab.add(T2,text="ส่งข้อความเข้าเทเลแกรม")



f_sheet = open("sheet.txt", "r", encoding='utf8')
namefile = os.listdir("token")

Tahoma13 = font.Font(family='Tahoma', size=13)
Tahoma15 = font.Font(family='Tahoma', size=15)
Tahoma18 = font.Font(family='Tahoma', size=18)


sheet1 = []
for x in f_sheet:
    sheet1.append(x)


##### GUI หน้าที่ 1 ########################################
listbox1 = StringVar()

T1_Label1 = Label(T1,text="เลือกชีตที่ส่ง",bg="lavender",font=Tahoma13).place(width=265,height=40,x=30,y=20)
listbox1 = Listbox(T1,selectmode=MULTIPLE)
listbox1.place(width=280,height=280,x=30,y=70)
scrolly = Scrollbar(T1,orient=VERTICAL,command=listbox1.yview)
scrolly.place(height=280,x=300,y=70)
listbox1.config(yscrollcommand=scrolly.set,font=Tahoma13)


T1_Label2 = Label(T1,text="เลือกกลุ่มที่ส่ง",bg="lavender",font=Tahoma13).place(width=265,height=40,x=300,y=20)
clicked_group = StringVar() 
clicked_group.set("เลือกกลุ่ม")
drop_group = OptionMenu( T1 , clicked_group , *namefile)
drop_group.place(width=230,height=40,x=330,y=80)
drop_group.config(font=Tahoma18)



T1_btn1 = Button(T1,text="ส่งเข้า Telegram",fg="white",bg="green",font=Tahoma15,command=group5).place(width=200,height=60,x=330,y=380)
T1_btn2 = Button(T1, text='ล้างข้อมูล',fg="white",bg="#212F3D",font=Tahoma15,command=lambda: my_remove_sel()).place(width=200,height=60,x=70,y=380)

for item in sheet1:
    listbox1.insert(END,item)

combo1 = Combobox(T1)



##### GUI หน้าที่ 2 ########################################


# สมมติว่า T2, namefile, send_telagram_message, sendphoto, my_remove_sel ถูกกำหนดไว้แล้ว

# ตัวแปรสำหรับเก็บชื่อไฟล์รูปภาพ
selected_image = None

# ฟังก์ชันสำหรับเลือกและแสดงรูปภาพ
def select_image():
    global selected_image
    filetypes = [("Image files", "*.png *.jpg *.jpeg *.gif *.bmp")]
    filename = filedialog.askopenfilename(title="เลือกไฟล์รูปภาพ", filetypes=filetypes)
    if filename:
        selected_image = filename
        image_label.config(text=f"ไฟล์: {filename.split('/')[-1]}")  # อัปเดตชื่อไฟล์
        show_image_preview(filename)  # เรียกฟังก์ชันแสดงรูปภาพ
    else:
        selected_image = None
        image_label.config(text="ไม่มีไฟล์ที่เลือก")

# ฟังก์ชันสำหรับแสดงหน้าต่างรูปภาพ
def show_image_preview(filename):
    # สร้างหน้าต่างใหม่
    preview_window = Toplevel(T2)
    preview_window.title("ตัวอย่างรูปภาพ")
    preview_window.geometry("400x400")  # ขนาดหน้าต่างเริ่มต้น

    try:
        # โหลดและปรับขนาดรูปภาพ
        image = Image.open(filename)
        # ปรับขนาดรูปภาพให้เหมาะสม (จำกัดความกว้าง/สูงไม่เกิน 350)
        image.thumbnail((350, 350), Image.Resampling.LANCZOS)
        photo = ImageTk.PhotoImage(image)

        # แสดงรูปภาพใน Label
        image_preview = Label(preview_window, image=photo)
        image_preview.image = photo  # เก็บ reference เพื่อป้องกัน garbage collection
        image_preview.pack(pady=10)

        # แสดงชื่อไฟล์ในหน้าต่าง
        Label(preview_window, text=f"ไฟล์: {filename.split('/')[-1]}", font=("Tahoma", 10)).pack()
    except Exception as e:
        messagebox.showerror("ข้อผิดพลาด", f"ไม่สามารถโหลดรูปภาพ: {e}")
        preview_window.destroy()

# ฟังก์ชันสำหรับส่งข้อความและรูปภาพ
def send_message_with_image():
    global selected_image
    text_content = text1.get("1.0", "end").strip()  # ดึงข้อความจาก Text widget
    text_group = clicked_group2.get()
    input_text = text1.get("1.0", "end-1c")

    if len(input_text) == 0:
        message_group = "กรุณาเลือกใส่ข้อความ"
        messagebox.showinfo("คุณยังไม่ได้ใส่ข้อความ", message_group)
        time.sleep(0.5)
        return    

    print("input =" + input_text)
    print(text_group)

    try:
        f_group1 = open("token/" + text_group, "r", encoding='utf8')
    except:
        message_group = "กรุณาเลือกกลุ่ม"
        messagebox.showinfo("คุณยังไม่ได้เลือกกลุ่ม", message_group)  
        time.sleep(0.5)
        return

    token_G1 = []
    name_G1 = []
    for x in f_group1:
        n = x.split()[0]
        t = x.split()[1]
        name_G1.append(n + ",")
        token_G1.append(t)

    if len(token_G1) == 0:
        message_group = "ยังไม่มี Token ที่จะส่ง"
        messagebox.showinfo("กรุณาเลือกใส่ Token", message_group)
        time.sleep(0.5)
        return
    print(token_G1)
    print(text_content)
    num = 1

    # เรียกฟังก์ชัน send_telagram_message สำหรับข้อความ (ถ้ามี)
    if text_content:
        for token in token_G1:
            send_telagram_message(text_content, token)
        messagebox.showinfo("สำเร็จ", "ส่งข้อความเรียบร้อย")
    
    # เรียกฟังก์ชัน sendphoto สำหรับรูปภาพ (ถ้ามี)
    if selected_image:
        for token in token_G1:
            sendphoto(token, selected_image, num)
        messagebox.showinfo("สำเร็จ", "ส่งรูปภาพเรียบร้อย")
    
    # รีเซ็ตหลังส่ง
    text1.delete("1.0", "end")
    selected_image = None
    image_label.config(text="ไม่มีไฟล์ที่เลือก")

# ฟังก์ชันล้างข้อมูล
def my_remove_sel():
    listbox1.selection_clear(0, 'end')
    text1.delete("1.0", "end")  # ล้างข้อความ
    clicked_group2.set("เลือกกลุ่ม")  # รีเซ็ตตัวเลือกกลุ่ม
    global selected_image
    selected_image = None
    image_label.config(text="ไม่มีไฟล์ที่เลือก")  # ล้างชื่อไฟล์

# สร้าง Label และ Text widget
T2_Label1 = Label(T2, text="พิมพ์ข้อความที่ส่ง", bg="lavender", font=("Tahoma", 13))
T2_Label1.place(width=265, height=40, x=30, y=20)

text1 = Text(T2, width=70, font=("Tahoma", 13))
text1.place(width=265, height=250, x=30, y=70)

# เพิ่มการผูกเหตุการณ์ Ctrl+V
def paste_text(event=None):
    try:
        text1.insert("insert", text1.clipboard_get())
    except:
        pass

text1.bind("<Control-v>", paste_text)

# เพิ่มเมนูบริบท (คลิกขวา)
def show_context_menu(event):
    context_menu = Menu(T2, tearoff=0)
    context_menu.add_command(label="Copy", command=lambda: text1.event_generate("<<Copy>>"))
    context_menu.add_command(label="Paste", command=paste_text)
    context_menu.add_command(label="Cut", command=lambda: text1.event_generate("<<Cut>>"))
    context_menu.post(event.x_root, event.y_root)

text1.bind("<Button-3>", show_context_menu)

# ปุ่มและ Label สำหรับแน)..บไฟล์รูปภาพ
image_button = Button(T2, text="แนบรูปภาพ", fg="white", bg="#4CAF50", font=("Tahoma", 12), command=select_image)
image_button.place(width=120, height=40, x=30, y=330)

image_label = Label(T2, text="ไม่มีไฟล์ที่เลือก", bg="lavender", font=("Tahoma", 10))
image_label.place(width=400, height=40, x=160, y=330)

# ส่วนที่เหลือของ UI
T2_Label2 = Label(T2, text="เลือกกลุ่มที่ส่ง", bg="lavender", font=("Tahoma", 13))
T2_Label2.place(width=265, height=40, x=300, y=20)

clicked_group2 = StringVar()
clicked_group2.set("เลือกกลุ่ม")
drop_group2 = OptionMenu(T2, clicked_group2, *namefile)
drop_group2.place(width=230, height=40, x=330, y=80)
drop_group2.config(font=("Tahoma", 18))

# ปุ่มส่งข้อความและล้างข้อมูล
T2_btn1 = Button(T2, text="ส่งข้อความ", fg="white", bg="red", font=("Tahoma", 18), command=send_message_with_image)
T2_btn1.place(width=200, height=60, x=330, y=380)

T1_btn2 = Button(T2, text="ล้างข้อมูล", fg="white", bg="#212F3D", font=("Tahoma", 15), command=my_remove_sel)
T1_btn2.place(width=200, height=60, x=70, y=380)

GUI.mainloop()


