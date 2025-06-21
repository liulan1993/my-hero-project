"use client";

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- [ SECTION 1: TYPE DEFINITIONS ] ---
// 在这里定义所有需要用到的 TypeScript 类型

interface FieldProps {
    id: string;
    label?: string;
    Component: React.FC<any>;
    [key: string]: any;
}

interface Field {
    id: string;
    title?: string;
    label?: string;
    Component: React.FC<FieldProps>;
    type?: string;
    placeholder?: string;
    options?: { label: string; value: string }[];
    name?: string;
    personType?: string;
    fieldSet?: Field[];
    columns?: { key: string; header: string }[];
    [key: string]: any;
}

interface Service {
    id: string;
    title: string;
    fields: Field[];
}


// --- [ SECTION 2: FORM FIELD COMPONENTS ] ---
// 这里是所有表单字段组件的实现 (之前在 components/FormComponents.tsx 中)

const FieldWrapper: React.FC<{ label?: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        {label && <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>}
        {children}
    </div>
);

const SectionHeader: React.FC<FieldProps> = ({ title }) => <h3 className="text-2xl font-semibold border-b border-gray-600 pb-2 mb-4 text-cyan-400">{title}</h3>;
const SubHeader: React.FC<FieldProps> = ({ title }) => <h4 className="text-xl font-semibold mt-4 mb-2 text-gray-200">{title}</h4>;

const FormField: React.FC<FieldProps> = ({ label, type = 'text', placeholder }) => (
    <FieldWrapper label={label}>
        <input
            type={type}
            placeholder={placeholder || `请输入${label}`}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
        />
    </FieldWrapper>
);

const TextareaField: React.FC<FieldProps> = ({ label, placeholder }) => (
    <FieldWrapper label={label}>
        <textarea
            placeholder={placeholder}
            rows={4}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
        />
    </FieldWrapper>
);

const RadioGroupField: React.FC<FieldProps> = ({ label, name, options = [] }) => (
    <FieldWrapper label={label}>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
            {options.map(opt => (
                <label key={opt.value} className="flex items-center space-x-2">
                    <input type="radio" name={name} value={opt.value} className="text-cyan-600 bg-gray-700 border-gray-500 focus:ring-cyan-500" />
                    <span>{opt.label}</span>
                </label>
            ))}
        </div>
    </FieldWrapper>
);

const CheckboxGroupField: React.FC<FieldProps> = ({ label, options = [] }) => (
    <FieldWrapper label={label}>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
            {options.map(opt => (
                <label key={opt.value} className="flex items-center space-x-2">
                    <input type="checkbox" value={opt.value} className="rounded text-cyan-600 bg-gray-700 border-gray-500 focus:ring-cyan-500" />
                    <span>{opt.label}</span>
                </label>
            ))}
        </div>
    </FieldWrapper>
);

const SelectField: React.FC<FieldProps> = ({ label, name, options = [] }) => (
    <FieldWrapper label={label}>
        <select name={name} className="w-full bg-gray-900/50 border border-gray-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </FieldWrapper>
);

const FileUploadField: React.FC<FieldProps> = ({ label }) => (
    <FieldWrapper label={label}>
        <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-900/50 hover:bg-gray-800/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="mb-2 text-sm text-gray-400">点击上传或拖拽文件到此处</p>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG</p>
                </div>
                <input type="file" className="hidden" />
            </label>
        </div>
    </FieldWrapper>
);

const DynamicPersonField: React.FC<FieldProps> = ({ title, personType, fieldSet = [], max }) => {
    const [persons, setPersons] = useState([{}]);
    const addPerson = () => !max || persons.length < max ? setPersons([...persons, {}]) : null;

    return (
        <div className="p-4 border border-gray-700 rounded-lg bg-white/5">
            <h4 className="text-xl font-semibold mb-4 text-gray-200">{title}</h4>
            {persons.map((_, personIndex) => (
                <div key={personIndex} className="space-y-4 border-t border-gray-600 pt-4 mt-4 first:mt-0 first:border-t-0">
                    <h5 className="font-bold text-gray-300">{personType} {personIndex + 1}</h5>
                    {fieldSet.map(field => {
                        const { Component, ...props } = field;
                        return <Component key={`${props.id}-${personIndex}`} {...props} />;
                    })}
                </div>
            ))}
            {(!max || persons.length < max) && (
                <button type="button" onClick={addPerson} className="mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded text-sm">
                    + 添加一位{personType}
                </button>
            )}
        </div>
    );
};

const TableField: React.FC<FieldProps> = ({ label, columns = [] }) => (
    <FieldWrapper label={label}>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800/50">
                    <tr>{columns.map(c => <th key={c.key} className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{c.header}</th>)}</tr>
                </thead>
                <tbody className="bg-gray-900/50 divide-y divide-gray-700">
                    {[1, 2].map(i => <tr key={i}>{columns.map(c => <td key={c.key} className="px-4 py-2"><input type="text" className="w-full bg-transparent text-white border-0 p-1 focus:ring-0" /></td>)}</tr>)}
                </tbody>
            </table>
        </div>
    </FieldWrapper>
);


// --- [ SECTION 3: FORM RENDERER COMPONENT ] ---
// 动态渲染整个表单的组件

const FormRenderer = ({ service }: { service: Service }) => {
    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            alert('表单已提交 (演示功能)');
        }}>
            <h2 className="text-3xl font-bold mb-8 text-white">{service.title}</h2>
            <div className="space-y-6">
                {service.fields.map((field: Field) => {
                    const { Component, ...props } = field;
                    return <Component key={props.id} {...props} />;
                })}
            </div>
            <button type="submit" className="mt-8 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg">
                提交信息
            </button>
        </form>
    );
};


// --- [ SECTION 4: FORM DATA AND STRUCTURES ] ---
// 所有表单的数据和结构定义 (之前在 lib/services.ts 中)
// **重要**: 请将您提供的完整字段数据粘贴到这里

const clientAgentFields: Field[] = [
    { id: 'fullName', label: '全名 (包括任何别名)', Component: FormField },
    { id: 'idNumber', label: '身份证/护照号码', Component: FormField },
    { id: 'homeAddress', label: '住家地址', Component: FormField },
    { id: 'nationality', label: '国籍', Component: FormField },
    { id: 'contactNumber', label: '联系号码', Component: FormField },
];
const directorFields: Field[] = [
    { id: 'fullName', label: '全名 (包括任何别名)', Component: FormField },
    { id: 'idNumber', label: '身份证/护照号码', Component: FormField },
    { id: 'gender', label: '性别', name:'director_gender', options: [{label:'男', value:'male'}, {label:'女', value:'female'}], Component: RadioGroupField },
    { id: 'expiry', label: '身份证 & 护照有效期', type: 'date', Component: FormField },
    { id: 'homeAddress', label: '住家地址', Component: FormField },
    { id: 'nationality', label: '国籍', Component: FormField },
    { id: 'dob', label: '出生日期', type: 'date', Component: FormField },
    { id: 'contactNumber', label: '联系号码', Component: FormField },
    { id: 'email', label: '邮箱地址', Component: FormField },
];
const shareholderFields: Field[] = [
    { id: 'fullName', label: '全名/公司名', Component: FormField },
    { id: 'idNumber', label: '身份证/护照号码/公司注册号(UEN)', Component: FormField },
    { id: 'gender', label: '性别', name:'shareholder_gender', options: [{label:'男', value:'male'}, {label:'女', value:'female'}], Component: RadioGroupField },
    { id: 'expiry', label: '身份证 & 护照有效期', type: 'date', Component: FormField },
    { id: 'address', label: '住家地址/公司注册地址/公司运营地址', Component: FormField },
    { id: 'dob', label: '出生日期/公司注册日期', type: 'date', Component: FormField },
    { id: 'nationality', label: '国籍/公司注册地', Component: FormField },
    { id: 'shares', label: '持股数量', type: 'number', Component: FormField },
    { id: 'contactNumber', label: '联系号码', Component: FormField },
    { id: 'email', label: '邮箱地址', Component: FormField },
];
const uboFields: Field[] = [
    { id: 'fullName', label: '全名 (包括任何别名)', Component: FormField },
    { id: 'idNumber', label: '身份证/护照号码', Component: FormField },
    { id: 'gender', label: '性别', name:'ubo_gender', options: [{label:'男', value:'male'}, {label:'女', value:'female'}], Component: RadioGroupField },
    { id: 'expiry', label: '身份证 & 护照有效期', type: 'date', Component: FormField },
    { id: 'homeAddress', label: '住家地址', Component: FormField },
    { id: 'nationality', label: '国籍', Component: FormField },
    { id: 'contactNumber', label: '联系号码', Component: FormField },
    { id: 'dob', label: '出生日期', type: 'date', Component: FormField },
    { id: 'ownershipInfo', label: '请提供实际受益所有权的性质信息', placeholder: '例如: 拥有超过25%的所有权', Component: TextareaField },
];
const contactFields: Field[] = [
    { id: 'name', label: '姓名', Component: FormField },
    { id: 'id', label: '新加坡身份证/护照号码', Component: FormField },
    { id: 'mobile', label: '手机号码', Component: FormField },
    { id: 'officePhone', label: '办公电话号码', Component: FormField },
    { id: 'email', label: '电邮地址', Component: FormField },
];

const services: Service[] = [
    {
        id: 'company-registration',
        title: '新加坡公司注册信息表',
        fields: [
            { id: 'reg_partA_clients', title: 'A部分: 客户/代理人信息', personType: '客户/代理人', fieldSet: clientAgentFields, Component: DynamicPersonField },
            { id: 'reg_partA_entity_header', title: '拟注册商业实体信息', Component: SubHeader },
            { id: 'reg_partA_entityName1', label: '实体名称 - 第一选择', placeholder:'按优先顺序', Component: FormField },
            { id: 'reg_partA_entityName2', label: '实体名称 - 第二选择', Component: FormField },
            { id: 'reg_partA_entityName3', label: '实体名称 - 第三选择', Component: FormField },
            { id: 'reg_partA_regAddress', label: '拟注册公司地址', Component: FormField },
            { id: 'reg_partA_opAddress', label: '拟注册公司运营地址', Component: FormField },
            { id: 'reg_partA_bizCountries', label: '企业主要开展业务的国家', placeholder:'1.国家 2.国家 3.国家', Component: TextareaField },
            { id: 'reg_partA_bizScope', label: '拟注册公司营业范围简介', Component: TextareaField },
            { id: 'reg_partA_capital', label: '公司注册金额 (新币)', type: 'number', Component: FormField },

            { id: 'reg_partB_directors', title: 'B部分: 公司董事信息 (至少一名新加坡本地董事)', personType: '董事', fieldSet: directorFields, Component: DynamicPersonField },
            { id: 'reg_partB_docs_header', title: '董事所需文件', Component: SubHeader },
            { id: 'reg_partB_doc_sg', label: '新加坡身份证复印件', Component: FileUploadField },
            { id: 'reg_partB_doc_ep', label: '新加坡工作准证 (EP) 复印件', Component: FileUploadField },
            { id: 'reg_partB_doc_passport', label: '护照复印件和经公证的地址证明', Component: FileUploadField },

            { id: 'reg_partC_shareholders', title: 'C部分: 公司股东信息 (个人/机构)', personType: '股东', fieldSet: shareholderFields, Component: DynamicPersonField },
            { id: 'reg_partC_docs_header', title: '个人股东所需文件', Component: SubHeader },
            { id: 'reg_partC_doc_sg_sh', label: '新加坡身份证复印件 (个人股东)', Component: FileUploadField },
            { id: 'reg_partC_doc_ep_sh', label: '新加坡工作准证 (EP) 复印件 (个人股东)', Component: FileUploadField },
            { id: 'reg_partC_doc_passport_sh', label: '护照复印件和经公证的地址证明 (个人股东)', Component: FileUploadField },

            { id: 'reg_partC_corp_docs_header', title: '如果股东是公司, 请提供以下文件', Component: SubHeader },
            { id: 'reg_partC_doc_incorp', label: '公司成立证书', Component: FileUploadField },
            { id: 'reg_partC_doc_moa', label: '公司章程或备忘同文件', Component: FileUploadField },
            { id: 'reg_partC_doc_bizfile', label: '公司注册商业档案 (Bizfile)', Component: FileUploadField },

            { id: 'reg_partD_ubos', title: 'D部分: 最终受益人信息', personType: '最终受益人', fieldSet: uboFields, Component: DynamicPersonField },

            { id: 'reg_partE_header', title: 'E部分: 财务年度截止日', Component: SectionHeader },
            { id: 'reg_partE_fye', label: '拟注册公司财务年度截止日应定为', type:'date', placeholder:'每个公历年的 [日期]', Component: FormField },

            { id: 'reg_partF_header', title: 'F部分: 政治公众人物、其直系亲属及密切关系人信息', Component: SectionHeader },
            { id: 'reg_partF_q1', label:'1. 上述人员中是否有任何⼈是政治公众人物?', name:'pep_q1', options:[{label:'是',value:'yes'}, {label:'否',value:'no'}], Component: RadioGroupField},
            { id: 'reg_partF_q2', label:'2. 上述人员中是否有任何⼈是已卸任的政治公众⼈物?', name:'pep_q2', options:[{label:'是',value:'yes'}, {label:'否',value:'no'}], Component: RadioGroupField},
            { id: 'reg_partF_q3', label:'3. 上述人员中是否有任何⼈与政治公众⼈物或已卸任的政治公众人物属于直系亲属或密切关系人?', name:'pep_q3', options:[{label:'是',value:'yes'}, {label:'否',value:'no'}], Component: RadioGroupField},
            { id: 'reg_partF_note', title:'注意: 请为每位政治公众人物, 其直系亲属或密切关系人填写一份政治公众人物 (PEP) 表格。', Component: SubHeader },

            { id: 'reg_partG_header', title: '授权与声明', Component: SectionHeader },
            { id: 'reg_partG_declaration', title:'本人声明, 本表格中所提供的信息真实且正确...', Component: SubHeader },
            { id: 'reg_partG_signature', label:'客户/代理签名', Component: FormField },
            { id: 'reg_partG_id', label:'身份证/护照号', Component: FormField },
        ]
    },
    {
        id: 'health-assessment',
        title: '健康溯源体检评估表',
        fields: [
            { id: 'ha_s1_header', title: '一、基本信息', Component: SectionHeader },
            { id: 'ha_s1_name', label: '姓名', placeholder: '请输入姓名', Component: FormField },
            { id: 'ha_s1_dob', label: '出生日期', type: 'date', Component: FormField },
            { id: 'ha_s1_gender', label: '性别', name: 'ha_gender', options: [{label:'男', value:'male'}, {label:'女', value:'female'}], Component: RadioGroupField },
            { id: 'ha_s1_contact', label: '联系方式 (手机号/微信)', placeholder: '请输入联系方式', Component: FormField },
            { id: 'ha_s2_header', title: '二、生活方式', Component: SectionHeader },
            { id: 'ha_s2_exercise', label: '运动频率', name: 'ha_exercise', options: [{label:'每周3次以上', value:'high'}, {label:'偶尔', value:'low'}, {label:'很少', value:'none'}], Component: RadioGroupField },
            { id: 'ha_s2_diet', label: '饮食习惯', name: 'ha_diet', options: [{label:'高盐高油', value:'unhealthy'}, {label:'偏素食', value:'veg'}, {label:'较多不规律饮食', value:'irregular'}], Component: RadioGroupField },
            { id: 'ha_s2_sleep', label: '睡眠情况', name: 'ha_sleep', options: [{label:'良好', value:'good'}, {label:'经常失眠/多梦', value:'insomnia'}, {label:'白天易疲劳', value:'fatigue'}], Component: RadioGroupField },
            { id: 'ha_s2_smoking', label: '是否吸烟', name:'ha_smoking', options: [{label:'请选择', value:''}, {label:'否', value:'no'}, {label:'是', value:'yes'}], Component: SelectField },
            { id: 'ha_s2_drinking', label: '是否饮酒', name:'ha_drinking', options: [{label:'请选择', value:''}, {label:'否', value:'no'}, {label:'是', value:'yes'}], Component: SelectField },
            { id: 'ha_s3_header', title: '三、家族重大疾病史', Component: SectionHeader },
            { id: 'ha_s3_familyHistory', label: '疾病史 (可多选)', options: [{label:'高血压', value:'hbp'}, {label:'糖尿病', value:'diabetes'}, {label:'心脑血管疾病', value:'cvd'}, {label:'癌症', value:'cancer'}, {label:'自身免疫疾病', value:'autoimmune'}, {label:'其他', value:'other'}, {label:'无明显家族病史', value:'none'}], Component: CheckboxGroupField },
            { id: 'ha_s4_header', title: '四、已有确诊病史或关注的健康问题', Component: SectionHeader },
            { id: 'ha_s4_diagnosed', label: '确诊病史 (可多选)', options: [{label:'甲状腺结节', value:'thyroid'}, {label:'血脂异常', value:'dyslipidemia'}, {label:'胃肠不适', value:'gi'}, {label:'乳腺结节/子宫肌瘤', value:'fibroid'}, {label:'肝胆结石/息肉', value:'gallstone'}, {label:'高血压/高血糖', value:'hbp_hbg'}, {label:'其他', value:'other'}], Component: CheckboxGroupField },
            { id: 'ha_s5_header', title: '五、目前已做过的检查', Component: SectionHeader },
            { id: 'ha_s5_tests', label: '检查项目 (可多选)', options: [{label:'常规体检(血常规, B超)', value:'routine'}, {label:'肿瘤筛查(如CEA, CA125等)', value:'tumor'}, {label:'胃肠镜检查', value:'endoscopy'}, {label:'心脑血管影像检查(CTA, 脑MRI)', value:'cardio_cta'}, {label:'无法确认(仅上传报告)', value:'upload_only'}], Component: CheckboxGroupField },
            { id: 'ha_s6_header', title: '六、服务目标', Component: SectionHeader },
            { id: 'ha_s6_goals', label: '服务目标 (可多选)', options: [{label:'看懂自己的体检报告', value:'understand_report'}, {label:'是否需要进一步检查', value:'further_check'}, {label:'了解哪些指标有长期变化风险', value:'risk_assess'}, {label:'咨询健康提升建议', value:'advice'}, {label:'帮忙预约体检/医疗资源', value:'booking'}], Component: CheckboxGroupField },
            { id: 'ha_s7_header', title: '七、上传体检报告', Component: SectionHeader },
            { id: 'ha_s7_upload', label: '请上传近3-5年的体检报告PDF或拍照版本', Component: FileUploadField },
            { id: 'ha_s8_header', title: '八、其他补充信息 (可选)', Component: SectionHeader },
            { id: 'ha_s8_extra', label: '补充信息', placeholder: '请输入其他需要说明的信息', Component: TextareaField },
        ]
    },
    // ... 在此处粘贴所有其他的服务定义，例如 permit, intl-school, bank-account 等 ...
].filter(s => s.id !== 'study' && s.id !== 'medical');


// --- [ SECTION 5: 3D SCENE AND ANIMATION COMPONENTS ] ---
// 您的3D背景动画代码

const Box = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
    const shape = new THREE.Shape();
    const angleStep = Math.PI * 0.5;
    const radius = 1;
    shape.absarc(2, 2, radius, angleStep * 0, angleStep * 1, false);
    shape.absarc(-2, 2, radius, angleStep * 1, angleStep * 2, false);
    shape.absarc(-2, -2, radius, angleStep * 2, angleStep * 3, false);
    shape.absarc(2, -2, radius, angleStep * 3, angleStep * 4, false);
    const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 20,
        curveSegments: 20
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    return (
        <mesh
            geometry={geometry}
            position={position}
            rotation={rotation}
        >
            <meshPhysicalMaterial 
                color="#232323"
                metalness={1}
                roughness={0.3}
                reflectivity={0.5}
                ior={1.5}
                emissive="#000000"
                emissiveIntensity={0}
                transparent={false}
                opacity={1.0}
                transmission={0.0}
                thickness={0.5}
                clearcoat={0.0}
                clearcoatRoughness={0.0}
                sheen={0}
                sheenRoughness={1.0}
                sheenColor="#ffffff"
                specularIntensity={1.0}
                specularColor="#ffffff"
                iridescence={1}
                iridescenceIOR={1.3}
                iridescenceThicknessRange={[100, 400]}
                flatShading={false}
            />
        </mesh>
    );
};

const AnimatedBoxes = () => {
    const groupRef = useRef<THREE.Group>(null!);
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.x += delta * 0.05;
            groupRef.current.rotation.y += delta * 0.05;
        }
    });
    const boxes = Array.from({ length: 50 }, (_, index) => ({
        position: [(index - 25) * 0.75, 0, 0] as [number, number, number],
        rotation: [ (index - 10) * 0.1, Math.PI / 2, 0 ] as [number, number, number],
        id: index
    }));

    return (
        <group ref={groupRef}>
            {boxes.map((box) => (
                <Box
                    key={box.id}
                    position={box.position}
                    rotation={box.rotation}
                />
            ))}
        </group>
    );
};

const Scene = () => {
    return (
        <div className="absolute inset-0 w-full h-full z-0">
            <Canvas camera={{ position: [0, 0, 15], fov: 40 }}>
                <ambientLight intensity={15} />
                <directionalLight position={[10, 10, 5]} intensity={15} />
                <AnimatedBoxes />
            </Canvas>
        </div>
    );
};


// --- [ SECTION 6: MAIN PAGE COMPONENT AND LOGIC ] ---
// 这是最终导出的页面组件

const ServiceSelection = ({ onSelect }: { onSelect: (service: Service) => void }) => {
    return (
        <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">资料上传口径</h1>
            <p className="text-lg text-gray-300 mb-8">请选择您需要办理的业务</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map(service => (
                    <button
                        key={service.id}
                        onClick={() => onSelect(service)}
                        className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300 text-left"
                    >
                        <h3 className="font-bold text-xl mb-2">{service.title}</h3>
                        <p className="text-gray-400 text-sm">点击开始填写 {service.title} 所需信息。</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default function Page() {
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    return (
        <div className="relative min-h-screen w-full bg-[#000] text-white flex flex-col items-center justify-center p-8 overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #000, #1A2428)' }}>
            <Scene />
            <div className="relative z-10 w-full max-w-7xl">
                {selectedService ? (
                    <div className="w-full bg-black/50 backdrop-blur-md rounded-xl p-8 border border-gray-700 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedService(null)}
                            className="mb-6 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
                        >
                            &larr; 返回选择服务
                        </button>
                        <FormRenderer service={selectedService} />
                    </div>
                ) : (
                    <ServiceSelection onSelect={setSelectedService} />
                )}
            </div>
        </div>
    );
};