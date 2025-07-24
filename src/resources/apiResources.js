//export const ADMIN_API_BASE_URL = "http://175.126.176.79/metacity";
//export const ADMIN_API_BASE_URL = "http://worder2.co.kr/metacity";
export const ADMIN_API_BASE_URL = "http://zzigbbang.com/a_tablet";
//export const ADMIN_API_BASE_URL = "http://183.110.232.247/metacity";
//export const ADMIN_API_BASE_URL = "http://new.worder2.co.kr/metacity"; // 신규 서버 

export const POS_BASE_URL = (ip) => {return `http://${ip}:8090/PosConnection`;}; // real


export const ADMIN_API_GOODS = "/goods2.php";
export const ADMIN_API_CATEGORY = "/category.php";
export const ADMIN_API_POST_ORDER = "/order2.php";
export const ADMIN_API_TABLE_STATUS = "/store_table.php";
export const ADMIN_API_STORE_INFO = "/store_info.php";
export const ADMIN_API_MENU_UPDATE = "/goods2_update.php";
export const ADMIN_API_MENU_CHECK = "/check_serviceable.php";
export const ADMIN_API_REGULAR_UPDATE = "/reqular_update.php";
export const ADMIN_PAY_LOG = "/pay1.php";

// 배너
export const ADMIN_API_BANNER = "/banner.php";

// 직원 호출목록 받아오기
export const ADMIN_API_CALL_SERVICE = "/call.php";
// 직원호출하기
export const ADMIN_API_POST_CALL_SERVICE = "/call2.php";


export const TMP_STORE_DATA = {"STORE_ID":"I24031800004"}

export const ADMIN_API_BANNER_DIR = ADMIN_API_BASE_URL+"/upload_file/banner/";


export const ERROR_DATA = {
    
}


// version code
export const POS_VERSION_CODE = "0010";
// wor codes
// 대분류 정보 조회
export const POS_WORK_CD_MAIN_CAT = "1000";
export const POS_WORK_CD_MAIN_CAT_RES = "1001";
// 중분류 정보조회 요청 
export const POS_WORK_CD_MID_CAT = "2000";
export const POS_WORK_CD_MID_CAT_RES = "2001";
// 소분류 정보조회 요청 
export const POS_WORK_CD_SUB_CAT = "3000";
export const POS_WORK_CD_SUB_CAT_RES = "3001";
// 테이블 정보 조회
export const POS_WORK_CD_TABLE_INFO = "4000";
// 상품 정보 조회
export const POS_WORK_CD_MENU_ITEMS = "5000";
// 선불제 주문 조회/요청/취소
export const POS_WORK_CD_PREPAY_ORDER_LIST = "6000";
export const POS_WORK_CD_PREPAY_ORDER_REQUEST = "6010";
export const POS_WORK_CD_PREPAY_ORDER_CANCEL = "6020";
// 상품 변경 여부 확인
export const POS_WORK_CD_IS_MENU_CHANGE = "7000";
// 상품 주문 가능 여부 확인
export const POS_WORK_CD_CAN_MENU_ORDER = "7010";
// 세트 그룹 정보조회
export const POS_WORK_CD_SET_GROUP_INFO = "8000";
// 세트 상품 정보조회
export const POS_WORK_CD_SET_GROUP_ITEM_INFO = "8010";
// 후불제 주문 요청
export const POS_WORK_CD_POSTPAY_ORDER = "8020";
// 후불제 주문 취소
export const POS_WORK_CD_POSTPAY_ORDER_CANCEL = "8030";
// 테이블 LOCK 요청
export const POS_WORK_CD_TABLE_LOCK = "8040";
// 테이블 작업 가능 여부 조회
export const POS_WORK_CD_TABLE_CAN_LOCK = "8050";
// 테이블 주문내역
export const POS_WORK_CD_TABLE_ORDER_LIST = "8060";
// 버전정보조회
export const POS_WORK_CD_VERSION = "8070";
// 결제금액 조회
export const POS_WORK_CD_PAID_AMT = "8080";
// 주문 결제 요청 (후불제)
export const POS_WORK_CD_REQ_PAY = "8090";
// 매장 정보 
export const POS_WORK_CD_REQ_STORE_INFO = "1100";
// 테이블 이동요청
export const POS_WORK_CD_REQ_TABLE_MOVE = "1110";
// 테이블 합석 요청
export const POS_WORK_CD_REQ_TABLE_MERGE = "1120";
// 에러 코드
export const POS_SUCCESS_CD = "E0000";


///////////////////
//export const AI_SERVER = "http://211.115.68.38:7846";
export const AI_SERVER = "http://211.174.63.23:7846";
//export const AI_SERVER = "http://221.165.27.101:7846";
export const AI_QUERY = "/query";
