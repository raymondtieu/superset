import { useState } from 'react';
import { t } from '@superset-ui/core';
import Modal from 'src/components/Modal';
import Button from 'src/components/Button';
import { AntdForm, Col, Row } from 'src/components';
import { FormItem } from 'src/components/Form';
import { Input } from 'src/components/Input';
import { UserWithPermissionsAndRoles, UndefinedUser } from '@superset-frontend/src/types/bootstrapTypes';

type PinterestTieringInfoModalProps = {
    dashboardId: number;
    show?: boolean;
    onHide?: () => void;
    onSubmit?: (params: Record<string, any>) => void;
    addSuccessToast: (message: string) => void;
    addDangerToast: (message: string) => void;
    user: UserWithPermissionsAndRoles | UndefinedUser;
  };

const PinterestTieringInfoModal = ({ dashboardId, show, onHide, onSubmit, addSuccessToast, addDangerToast, user }: PinterestTieringInfoModalProps) => {
  const [form] = AntdForm.useForm();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Modal
      show={show}
      onHide={onHide}
      title={t('Edit tiering information')}
      footer={
        <>
          <Button
            htmlType="button"
            buttonSize="small"
            onClick={onHide}
            data-test="tiering-modal-cancel-button"
            cta
          >
            {t('Cancel')}
          </Button>
          <Button
            data-test="tiering-modal-save-button"
            onClick={form.submit}
            buttonSize="small"
            buttonStyle="primary"
            className="m-r-5"
            cta
            disabled={false}
          >
            {t('Save')}
          </Button>
        </>
      }
      responsive
      maxWidth="600px"
    >
      <AntdForm
        form={form}
        data-test="pinterest-tiering-form"
        layout="vertical"
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <FormItem label={t('Tier')} name="tier" required rules={[{ required: true }]}>
              <Input type="text" disabled={isLoading} />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <FormItem label={t('Nimbus project')} name="nimbusProject" required rules={[{ required: true }]}>
              <Input type="text" disabled={isLoading} />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <FormItem label={t('Domain')} name="domain" required rules={[{ required: true }]}>
              <Input type="text" disabled={isLoading} />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24}>
            <FormItem label={t('Description')} name="description" required rules={[{ required: true }]}>
              <Input type="text" disabled={isLoading} />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <FormItem label={t('Slack channel')} name="slackChannel" required rules={[{ required: true }]}>
              <Input type="text" disabled={isLoading} />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <FormItem label={t('SLA')} name="sla" required rules={[{ required: true }]}>
              <Input type="text" disabled={isLoading} />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <FormItem label={t('Audience')} name="audience" required rules={[{ required: true }]}>
              <Input type="text" disabled={isLoading} />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24}>
            <FormItem label={t('Intended purpose')} name="intendedPurpose" required rules={[{ required: true }]}>
              <Input type="text" disabled={isLoading} />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24}>
            <FormItem label={t('Known caveats')} name="knownCaveats" required rules={[{ required: true }]}>
              <Input type="text" disabled={isLoading} />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24}>
            <FormItem label={t('Tier 1 justification')} name="tier1Justification" required rules={[{ required: true }]}>
              <Input type="text" disabled={isLoading} />
            </FormItem>
          </Col>
        </Row>
      </AntdForm>
    </Modal>
  );
};

export default PinterestTieringInfoModal;