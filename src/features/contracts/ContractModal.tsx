import { Form } from 'antd'
import { Field, FormikErrors, FieldProps } from 'formik'
import React from 'react'
import { connect } from 'react-redux'
import { Action, ActionCreator, bindActionCreators, Dispatch } from 'redux'

import { createContractCancelled, createOrUpdateContract } from './actions'
import { ContractState } from './reducer'
import { Contract, CreateContract } from './types'
import { Status } from "../common/types" // TODO: this shouldn't be the case with Sagas
import { TextAreaFormItem, InputFormItem } from 'components'
import { ABI, Bytecode } from './contract-sample-data'
import { validateSourceCode } from '../../features/compiler/web-workers/compiler-worker/actions'
import { simpleCompilerInput } from '../../features/compiler/web-workers/compiler-worker/compiler-input'
import { solc } from '../../utils/compiler'

import { ContractModalComponent } from "./ContractModalComponent";
import { RadioField, defaultRadioFormOptions } from './components/radiofield';
import { ApplicationState } from '../rootReducer';

const FORM_ID = 'CONTRACT_FORM'

interface OwnProps {
  itemToEdit?: Contract
}

interface StateProps {
  visible: boolean
  loading: boolean
  submitted: boolean
  createContract: CreateContract
  // validatingSourceCode: boolean
}

interface DispatchProps {
  createOrUpdateContract: (item: Contract) => void
  createContractCancelled: ActionCreator<Action>
  validateSourceCode: ActionCreator<Action>
}

type AllProps = OwnProps & DispatchProps & StateProps

export class ContractModal extends React.Component<AllProps> {
  compiler: any

  componentDidMount() {
    this.compiler = solc.compile
    const sourceCode = `
pragma solidity ^0.5.8;

contract SimpleStorage {
    
    uint256 value;
    
    constructor() public {
        value = 1000;
    }
    
    function getValue(uint256 newValue) public view returns(uint256){
        if(newValue > 100){
            return newValue;
        }
        return value;
    }
}`
    this.sourceCodeIsValid(sourceCode, 'SimpleStorage.sol')
    // TODO.. I'm not sure how this part works, is like I need to cache the usage
    // of my module. Not sure if webpack is doing code splitting.
  }

  sourceCodeIsValid = (sourceCode: string, name: string) => {
    const inputObject: any = {}
    inputObject[`${name}`] = {
      content: sourceCode
    }
    const input = simpleCompilerInput(inputObject, { optimize: true })
    const result = JSON.parse(this.compiler(input))
    console.log('RESULT', result)
    return result.errors === undefined
  }

  saveContract = (item: Contract) => {
    // if (this.state.itemToEdit) { // TODO
    //     // update values
    // }
    console.log('save Contract', item)
    const newItemWithSampleData = {
      ...item,
      abi: ABI as any,
      bytecode: Bytecode
    }
    this.props.createOrUpdateContract(newItemWithSampleData)
  }

  render() {
    return (
      <ContractModalComponent
        formId={FORM_ID}
        title="Add Contract Instance"
        onSubmit={this.saveContract}
        visible={this.props.visible}
        loading={this.props.loading}
        onCancel={this.props.createContractCancelled}
        disableSubmitButton={false} // this.props.validatingSourceCode TODO: Disable when compiling
        initialValues={{ name: 'ERC20.sol', sourceCode: '', abi: [], bytecode: '' }}
        validator={(items: Contract) => {
          console.log('Validator called')
          const errors: FormikErrors<Contract> = {}
          if (!items.name) {
            errors.name = 'Required'
          }
          if (!items.address) {
            errors.address = 'Required'
          }
          if (!items.sourceCode) {
            errors.sourceCode = 'Required'
          }

          if (items.name && items.sourceCode && !this.sourceCodeIsValid(items.sourceCode, items.name)) {
            errors.sourceCode = 'Invalid solidity code'
          }

          return errors
        }}
        FormComponent={({ onSubmit }) => (
          <Form id={FORM_ID} onSubmit={onSubmit}>
            <Field
              name="name"
              render={(innerProps: FieldProps) => <InputFormItem {...innerProps} label="Name" placeHolder="Contract.Sol" />}
            />
            <Field
              name="address"
              render={(innerProps: FieldProps) => (
                <InputFormItem {...innerProps} label="Address" placeHolder="0xAC716460A84B85d774bEa75666ddf0088b024741" />
              )}
            />
            <Field
              name="type"
              render={(innerProps: FieldProps) => (
                <RadioField options={defaultRadioFormOptions} defaultValue="sourcecode" label="From" {...innerProps} />
              )}
            />
            <Field
              name="sourceCode"
              render={(innerProps: FieldProps) => (
                <TextAreaFormItem label="Source code" placeHolder="pragma solidity ^0.5.8" {...innerProps} />
              )}
            />
          </Form>
        )}
      />
    )
  }
}

const mapStateToProps = ({ contractState }: ApplicationState) => {
  return {
    createContract: contractState.createContract,
    visible: contractState.createContract.status === Status.Started,
    submitted: contractState.createContract.status === Status.Completed,
    loading: contractState.createContract.status === Status.InProgress,
    // validatingSourceCode: contractState.validateSourceCode.status === Status.Started
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => {
  return bindActionCreators(
    {
      createOrUpdateContract,
      createContractCancelled,
      validateSourceCode
    },
    dispatch
  )
}

export default connect<StateProps, DispatchProps, {}, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps
)(ContractModal)
